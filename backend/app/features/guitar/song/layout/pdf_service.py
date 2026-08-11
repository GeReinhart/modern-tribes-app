import hashlib
from pathlib import Path

from weasyprint import HTML

from app.platform.core.config import settings
from app.platform.functions.labels.repository import fetch_label_details
from app.features.guitar.song.layout import pdf_cache_repository as pdf_cache_repo
from app.features.guitar.song.layout.models import ROW_WIDTH_TWELFTHS
from app.features.guitar.song.layout.pdf_blocks import (
    BLOCK_RENDERERS,
    FREEFORM_HEADING_CSS,
    render_block_title,
    render_chord_grid_block,
    render_chords_block,
    render_custom_block,
    render_labels_block,
    render_sections_block,
)

# Compact blocks (small stat blocks) flow side by side within a column instead of each
# claiming a full row — e.g. tempo, time signature and capo sit together like the old
# combined "stats" block used to.
_COMPACT_BLOCK_TYPES = {"tempo", "time_signature", "capo"}


def _localize_upload_urls(html: str) -> str:
    """WeasyPrint fetches every <img src> itself, with no browser session and (for locally
    stored uploads) no guarantee the backend can reach its own public BASE_URL at render time --
    a failed fetch is only logged, never raised, so the image just silently vanishes from the
    PDF. Locally stored uploads are served straight off disk from UPLOAD_DIR (see the /uploads
    StaticFiles mount in main.py), so rewriting their URL to a file:// path lets WeasyPrint read
    the bytes directly instead of round-tripping over HTTP. Cellar-hosted uploads use a
    different host entirely and are left untouched -- WeasyPrint fetches those over the network."""
    upload_url_prefix = f"{settings.BASE_URL}/uploads/"
    upload_dir = Path(settings.UPLOAD_DIR).resolve()
    return html.replace(upload_url_prefix, f"file://{upload_dir}/")


async def render_song_pdf(pool, song, user_id: str) -> bytes:
    """Only one rendered PDF is kept per song. The HTML that would be rendered is hashed and
    compared against the stored hash, so an unchanged song skips WeasyPrint entirely and is
    served its already-rendered copy instead of regenerating it on every download."""
    label_details = await _fetch_label_details_if_needed(pool, song)
    html_document = _localize_upload_urls(_build_html_document(song, label_details))
    content_hash = hashlib.sha256(html_document.encode("utf-8")).hexdigest()
    cached = await pdf_cache_repo.fetch_cached_pdf(pool, song.id)
    if cached and cached["content_hash"] == content_hash:
        return cached["pdf_bytes"]
    pdf_bytes = HTML(string=html_document).write_pdf()
    await pdf_cache_repo.upsert_cached_pdf(pool, song.id, content_hash, pdf_bytes, user_id)
    return pdf_bytes


async def _fetch_label_details_if_needed(pool, song) -> dict:
    uses_labels_block = any(
        block.block_type == "labels" for row in song.layout.rows for column in row.columns for block in column.blocks
    )
    if uses_labels_block and song.label_ids:
        return await fetch_label_details(pool, song.label_ids)
    return {}


def _css_string_escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace('"', '\\"')


def _footer_css(song) -> str:
    footer_text = _css_string_escape(f"{song.title} - {song.author}" if song.author else song.title)
    return (
        f'@bottom-center {{ content: "{footer_text}"; font-size: 9px; color: #666666; }} '
        '@bottom-right { content: counter(page) " / " counter(pages); font-size: 9px; color: #666666; }'
    )


def _build_html_document(song, label_details: dict) -> str:
    settings = song.layout.settings
    rows_html = "".join(
        _render_row(row, song, label_details) for row in sorted(song.layout.rows, key=lambda r: r.position)
    )
    margin = f"{settings.margin_top_mm}mm {settings.margin_right_mm}mm {settings.margin_bottom_mm}mm {settings.margin_left_mm}mm"
    return (
        "<!doctype html><html><head><meta charset=\"utf-8\" />"
        f"<style>@page {{ size: A4 portrait; margin: {margin}; {_footer_css(song)} }} "
        "body { font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 0; } "
        ".layout-row { display: flex; width: 100%; } "
        f".freeform img {{ max-width: 100%; height: auto; }} {FREEFORM_HEADING_CSS}</style>"
        f"</head><body>{rows_html}</body></html>"
    )


def _render_row(row, song, label_details: dict) -> str:
    break_style = "page-break-before: always;" if row.page_break_before else ""
    columns_html = "".join(
        _render_column(column, song, label_details) for column in sorted(row.columns, key=lambda c: c.position)
    )
    return f'<div class="layout-row" style="{break_style}">{columns_html}</div>'


def _render_block(block, song, label_details: dict, zoom: float) -> str:
    if block.block_type == "custom":
        return render_custom_block(block, zoom)
    if block.block_type == "chord_grid":
        return render_chord_grid_block(block, song, zoom)
    if block.block_type == "chords":
        return render_chords_block(block, song, zoom)
    if block.block_type == "labels":
        return render_labels_block(song, label_details, zoom)
    if block.block_type == "sections":
        return render_sections_block(block, song, zoom)
    return BLOCK_RENDERERS[block.block_type](song, zoom)


def _wrap_in_card(content: str, zoom: float) -> str:
    return f'<div style="border:1px solid #ccc;border-radius:{8 * zoom}px;padding:{12 * zoom}px;">{content}</div>'


def _render_block_wrapper(block, song, label_details: dict, column_width_twelfths: int) -> str:
    zoom = block.zoom_percent / 100
    body = _render_block(block, song, label_details, zoom)
    title_html = render_block_title(block, zoom)
    # Mirrors the web read view's rule (songLayoutCollectionBlocks.tsx returning null for an
    # empty chords/videos/sections/chord_grid block): an empty block shows no title either, so a
    # default label like "Chords" never prints above nothing. A 'custom' ("free text") block is
    # the one exception -- songLayoutBlockContentDispatch.tsx's 'custom' case shows its title and
    # body independently, so a title-only custom block (no body at all) is a valid, meaningful
    # state on screen and must not vanish here.
    if block.block_type == "custom":
        if not title_html and not body:
            return ""
    elif not body:
        return ""
    content = title_html + body
    if block.show_card:
        content = _wrap_in_card(content, zoom)
    padding = (
        f"padding:{block.padding_top_mm}mm {block.padding_right_mm}mm "
        f"{block.padding_bottom_mm}mm {block.padding_left_mm}mm;box-sizing:border-box;"
    )
    width_style = ""
    if block.width_twelfths < ROW_WIDTH_TWELFTHS:
        # block.width_twelfths is on the same 0-12 scale as a row's columns ("3/12" of the page),
        # not of whichever column it sits in — rescale to a column-relative percentage so a
        # narrow block inside an already-narrow column isn't narrowed twice.
        width_pct = min(100, block.width_twelfths / column_width_twelfths * 100)
        width_style = f"width:{width_pct}%;box-sizing:border-box;"
    if block.block_type in _COMPACT_BLOCK_TYPES:
        return f'<div style="display:inline-block;vertical-align:bottom;{width_style}{padding}margin:0 {16 * zoom}px {8 * zoom}px 0;">{content}</div>'
    if width_style:
        return f'<div style="display:inline-block;vertical-align:bottom;{width_style}{padding}margin-bottom:{8 * zoom}px;">{content}</div>'
    return f'<div style="{padding}margin-bottom:{8 * zoom}px;">{content}</div>'


# Same subtle, low-opacity solid line as the web read view's separatorBorder -- deliberately
# distinct from any structural aid, since this is real presentation content shown on both.
_COLUMN_SEPARATOR_BORDER = "1px solid rgba(26,26,26,0.19)"


def _render_column(column, song, label_details: dict) -> str:
    width_pct = column.width_twelfths / ROW_WIDTH_TWELFTHS * 100
    padding = (
        f"{column.padding_top_mm}mm {column.padding_right_mm}mm "
        f"{column.padding_bottom_mm}mm {column.padding_left_mm}mm"
    )
    border_left = f"border-left:{_COLUMN_SEPARATOR_BORDER};" if column.separator_left else ""
    border_right = f"border-right:{_COLUMN_SEPARATOR_BORDER};" if column.separator_right else ""
    blocks_html = "".join(
        _render_block_wrapper(block, song, label_details, column.width_twelfths) for block in column.blocks
    )
    return (
        f'<div style="width:{width_pct}%;text-align:{column.align};padding:{padding};'
        f'{border_left}{border_right}box-sizing:border-box;">'
        f"{blocks_html}</div>"
    )
