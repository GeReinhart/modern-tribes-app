import hashlib

from weasyprint import HTML

from app.platform.functions.labels.repository import fetch_label_details
from app.features.guitar.song.layout import pdf_cache_repository as pdf_cache_repo
from app.features.guitar.song.layout.pdf_blocks import BLOCK_RENDERERS, render_custom_block, render_labels_block

# Compact blocks (small stat blocks) flow side by side within a column instead of each
# claiming a full row — e.g. tempo, time signature and capo sit together like the old
# combined "stats" block used to.
_COMPACT_BLOCK_TYPES = {"tempo", "time_signature", "capo"}


async def render_song_pdf(pool, song, user_id: str) -> bytes:
    """Only one rendered PDF is kept per song. The HTML that would be rendered is hashed and
    compared against the stored hash, so an unchanged song skips WeasyPrint entirely and is
    served its already-rendered copy instead of regenerating it on every download."""
    label_details = await _fetch_label_details_if_needed(pool, song)
    html_document = _build_html_document(song, label_details)
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
        ".layout-row { display: flex; width: 100%; }</style>"
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
    if block.block_type == "labels":
        return render_labels_block(song, label_details, zoom)
    return BLOCK_RENDERERS[block.block_type](song, zoom)


def _wrap_in_card(content: str, zoom: float) -> str:
    return f'<div style="border:1px solid #ccc;border-radius:{8 * zoom}px;padding:{12 * zoom}px;">{content}</div>'


def _render_block_wrapper(block, song, label_details: dict, column_width_eighths: int) -> str:
    zoom = block.zoom_percent / 100
    content = _render_block(block, song, label_details, zoom)
    if block.show_card:
        content = _wrap_in_card(content, zoom)
    width_style = ""
    if block.width_eighths < 8:
        # block.width_eighths is on the same 0-8 scale as a row's columns ("3/8" of the page),
        # not of whichever column it sits in — rescale to a column-relative percentage so a
        # narrow block inside an already-narrow column isn't narrowed twice.
        width_pct = min(100, block.width_eighths / column_width_eighths * 100)
        width_style = f"width:{width_pct}%;box-sizing:border-box;"
    if block.block_type in _COMPACT_BLOCK_TYPES:
        return f'<div style="display:inline-block;vertical-align:bottom;{width_style}margin:0 {16 * zoom}px {8 * zoom}px 0;">{content}</div>'
    if width_style:
        return f'<div style="display:inline-block;vertical-align:bottom;{width_style}margin-bottom:{8 * zoom}px;">{content}</div>'
    return f'<div style="margin-bottom:{8 * zoom}px;">{content}</div>'


def _render_column(column, song, label_details: dict) -> str:
    width_pct = column.width_eighths / 8 * 100
    padding = (
        f"{column.padding_top_mm}mm {column.padding_right_mm}mm "
        f"{column.padding_bottom_mm}mm {column.padding_left_mm}mm"
    )
    blocks_html = "".join(
        _render_block_wrapper(block, song, label_details, column.width_eighths) for block in column.blocks
    )
    return (
        f'<div style="width:{width_pct}%;text-align:{column.align};padding:{padding};box-sizing:border-box;">'
        f"{blocks_html}</div>"
    )
