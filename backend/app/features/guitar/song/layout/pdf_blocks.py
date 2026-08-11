"""Renders each layout block type to a static HTML fragment for the PDF. Word-level chord
badges above lyrics are simplified to "start, middle, end chords above the word, before/after
chords beside it" — legible on paper even though it collapses the on-screen absolute
positioning of chord_start/chord_middle/chord_end into one line.

Every renderer takes a `zoom` multiplier (1.0 = 100%) and scales its own pixel dimensions by
it, rather than relying on CSS transform:scale — WeasyPrint doesn't resize a box to fit a
scaled descendant, so a transformed block either overflows its card border or leaves it mostly
empty. Description/custom blocks hold arbitrary rich text from a WYSIWYG editor, so instead of
per-element scaling they're wrapped in a container with an explicit base font-size, which
correctly grows any nested heading/paragraph that doesn't override its own font-size."""
import re
from html import escape

from app.features.guitar.song.layout.chord_diagram_html import (
    compute_window_size,
    diagram_pixel_width,
    render_chord_diagram_html,
)
from app.features.guitar.song.layout.models import TITLE_EDITABLE_BLOCK_TYPES
from app.features.guitar.song.layout.qr_code import qr_code_data_uri

_LABEL_COLOR = "#1a1a1a"
_SECONDARY_COLOR = "#666666"
_BASE_FONT_SIZE = 16

# Chords, videos and chord grids show a default label out of the box; custom/labels/description/
# sections default to no title at all (block.custom_title stays None) until the user names them --
# a 'sections' block used to also show a second, section-owned title beneath this one, which is
# why it needed a generic default; now the block's own title is the only one, so an unnamed block
# prints nothing rather than a generic "Lyrics & Chords" heading above blank content.
_DEFAULT_BLOCK_TITLES = {
    "chords": "Chords", "videos": "Videos", "chord_grid": "Chord Grid",
}
_HEADING_SIZES_PX = {"h1": 24, "h2": 20, "h3": 16, "h4": 13, "h5": 12}

# A heading typed into free-form rich text (description/custom/chord grid comment) must render
# at the exact same size as a block's own title at that level -- in em, relative to .freeform's
# own font-size (already scaled by that block's zoom), so it stays correct at any zoom without
# needing its own per-instance style tag (see pdf_service._build_html_document, where this is
# spliced into the single page-wide stylesheet). H5 is non-bold and italic instead of bold,
# same toned-down treatment as a block's own h5 title in render_block_title below.
FREEFORM_HEADING_CSS = "".join(
    f".freeform {level} {{ font-size: {size / _BASE_FONT_SIZE}em; "
    f"{'font-style: italic;' if level == 'h5' else 'font-weight: 700;'} color: {_LABEL_COLOR}; "
    "margin: 0 0 8px; } "
    for level, size in _HEADING_SIZES_PX.items()
)


def render_block_title(block, zoom: float) -> str:
    if block.block_type not in TITLE_EDITABLE_BLOCK_TYPES:
        return ""
    title = block.custom_title if block.custom_title is not None else _DEFAULT_BLOCK_TITLES.get(block.block_type, "")
    if not title:
        return ""
    size_px = _HEADING_SIZES_PX[block.title_heading_level]
    # H5 is a deliberately toned-down heading level any block type can pick (not tied to any one
    # block type) -- non-bold and italic, unlike H1-H4 (mirrors the on-screen
    # SongEditableBlockTitle styling). 'sections' ("Lyrics & Chords") blocks default to it.
    weight_style = "font-style:italic;" if block.title_heading_level == "h5" else "font-weight:700;"
    return (
        f'<div style="{weight_style}font-size:{size_px * zoom}px;color:{_LABEL_COLOR};'
        f'margin-bottom:{6 * zoom}px;">{escape(title)}</div>'
    )


def render_title_block(song, zoom: float) -> str:
    return f'<h1 style="font-size:{28 * zoom}px;margin:0;color:{_LABEL_COLOR};">{escape(song.title)}</h1>'


def render_author_block(song, zoom: float) -> str:
    if not song.author:
        return ""
    return f'<div style="font-size:{16 * zoom}px;font-weight:600;color:{_LABEL_COLOR};">{escape(song.author)}</div>'


def _render_stat(label: str, value: str, zoom: float) -> str:
    return (
        f'<div style="margin-right:{20 * zoom}px;"><div style="font-size:{10 * zoom}px;color:{_SECONDARY_COLOR};">'
        f'{label}</div><div style="font-size:{15 * zoom}px;font-weight:700;color:{_LABEL_COLOR};">'
        f"{escape(value)}</div></div>"
    )


def render_tempo_block(song, zoom: float) -> str:
    return f'<div style="display:flex;">{_render_stat("BPM", str(song.tempo_bpm), zoom)}</div>'


def render_time_signature_block(song, zoom: float) -> str:
    return f'<div style="display:flex;">{_render_stat("Time", f"{song.beats_per_bar}/4", zoom)}</div>'


def render_capo_block(song, zoom: float) -> str:
    capo = str(song.capo) if song.capo > 0 else "–"
    return f'<div style="display:flex;">{_render_stat("Capo", capo, zoom)}</div>'


def _is_blank_html(content_html: str | None) -> bool:
    """The rich-text editor never actually saves an empty string for "nothing typed" -- it saves
    an empty paragraph (e.g. "<p><br></p>"), which is truthy and would otherwise still render a
    blank line taking up space. An embedded image with no surrounding text is NOT blank, even
    though stripping every tag leaves no text behind -- content is blank only when it has
    neither text nor an image."""
    if not content_html:
        return True
    if re.search(r"<img\b", content_html, re.IGNORECASE):
        return False
    return not re.sub(r"&nbsp;", "", re.sub(r"<[^>]*>", "", content_html)).strip()


def _wrap_freeform_html(content_html: str, zoom: float) -> str:
    if _is_blank_html(content_html):
        return ""
    # "freeform" class caps embedded images at their column's width (see the matching CSS rule
    # in pdf_service._build_html_document) -- without it, an image narrower than its on-screen
    # column (which caps via Tailwind's preflight img reset) would overflow the column in the
    # PDF instead of shrinking to match, since WeasyPrint has no such rule of its own.
    return f'<div class="freeform" style="font-size:{_BASE_FONT_SIZE * zoom}px;">{content_html}</div>'


def render_description_block(song, zoom: float) -> str:
    return _wrap_freeform_html(song.description_html, zoom)


def render_custom_block(block, zoom: float) -> str:
    return _wrap_freeform_html(block.custom_content_html, zoom)


def _render_chord_grid_cell_item(item, chords_by_id: dict, zoom: float, chord_size_px: int) -> str:
    if item.item_type == "chord":
        chord = chords_by_id.get(item.chord_id)
        return _chord_badge(chord, zoom, chord_size_px) if chord else ""
    return (
        f'<span style="font-size:{chord_size_px * zoom}px;color:{_LABEL_COLOR};">'
        f'{escape(item.text or "")}</span>'
    )


def _chord_grid_row_style(item_count: int) -> str:
    """Same positioning rule as the on-screen grid: one chord at the cell's left; two chords as
    if the cell were split into two identical halves, each at the left of its own half; three or
    more justified across the full width. Flex-basis wrappers (not CSS grid) for the two-item
    case, since WeasyPrint's flexbox support is solid but its grid support is not."""
    if item_count == 2:
        return "display:flex;width:100%;"
    justify = "space-between" if item_count > 2 else "flex-start"
    return f"display:flex;gap:2px;align-items:center;width:100%;justify-content:{justify};"


def _render_chord_grid_cell(cell, chords_by_id: dict, zoom: float, chord_size_px: int) -> str:
    border_style = "".join(
        f"border-{side}:1px solid {_LABEL_COLOR};"
        for side, enabled in (
            ("top", cell.border_top), ("right", cell.border_right),
            ("bottom", cell.border_bottom), ("left", cell.border_left),
        )
        if enabled
    )
    item_count = len(cell.items)
    item_wrapper_style = "flex:1 1 0%;text-align:left;" if item_count == 2 else ""
    items_html = "".join(
        f'<div style="{item_wrapper_style}">{_render_chord_grid_cell_item(item, chords_by_id, zoom, chord_size_px)}</div>'
        for item in cell.items
    )
    return (
        f'<td style="{border_style}padding:{6 * zoom}px;vertical-align:middle;">'
        f'<div style="{_chord_grid_row_style(item_count)}">{items_html}</div></td>'
    )


def render_chord_grid_block(block, song, zoom: float) -> str:
    rows = block.chord_grid_rows
    if not rows:
        return _wrap_freeform_html(block.custom_content_html, zoom)
    chords_by_id = {song_chord.chord.id: song_chord.chord for song_chord in song.chords}
    chord_size_px = block.chord_grid_chord_size_px
    rows_html = "".join(
        f'<tr>{"".join(_render_chord_grid_cell(cell, chords_by_id, zoom, chord_size_px) for cell in row)}</tr>'
        for row in rows
    )
    table_html = f'<table style="border-collapse:collapse;width:100%;table-layout:fixed;">{rows_html}</table>'
    return f"{table_html}{_wrap_freeform_html(block.custom_content_html, zoom)}"


def render_chords_block(block, song, zoom: float) -> str:
    if not block.chords:
        return ""
    shared_window_size = max(compute_window_size(bc.chord.frets) for bc in block.chords)
    card_width = diagram_pixel_width(song.chord_diagram_size, song.chord_diagram_style, zoom)
    items = []
    for block_chord in block.chords:
        chord = block_chord.chord
        comment = (
            f'<div style="font-size:{11 * zoom}px;font-style:italic;color:{_SECONDARY_COLOR};">'
            f"{escape(block_chord.comment)}</div>"
            if block_chord.comment else ""
        )
        diagram = render_chord_diagram_html(
            chord.frets, chord.root_note, song.chord_diagram_style, song.chord_diagram_size,
            min_window_size=shared_window_size, extra_scale=zoom,
        )
        items.append(
            f'<div style="display:inline-block;vertical-align:top;text-align:center;width:{card_width}px;'
            f'margin:0 {28 * zoom}px {24 * zoom}px 0;">'
            f'<div style="font-weight:700;font-size:{14 * zoom}px;color:{_LABEL_COLOR};">{escape(chord.name)}</div>'
            f'{diagram}{comment}</div>'
        )
    return f'<div>{"".join(items)}</div>'


def _chord_badge(chord, zoom: float, chord_size_px: int) -> str:
    return (
        f'<span style="font-weight:700;color:{_LABEL_COLOR};font-size:{chord_size_px * zoom}px;">'
        f'{escape(chord.name)}</span>'
    )


def _word_html(word, zoom: float, text_size_px: int, chord_size_px: int) -> str:
    # inline-block (not inline-flex) throughout — WeasyPrint doesn't reliably flow
    # inline-flex boxes inline with their siblings, which forced one word per line.
    above = [word.chords[p] for p in ("start", "middle", "end") if p in word.chords]
    above_html = " ".join(_chord_badge(c, zoom, chord_size_px) for c in above)
    before_chord = word.chords.get("before")
    after_chord = word.chords.get("after")
    before_html = (
        f'<span style="display:inline-block;vertical-align:top;">'
        f'{_chord_badge(before_chord, zoom, chord_size_px)}</span> '
        if before_chord else ""
    )
    after_html = (
        f' <span style="display:inline-block;vertical-align:top;">'
        f'{_chord_badge(after_chord, zoom, chord_size_px)}</span>'
        if after_chord else ""
    )
    return (
        f'<span style="display:inline-block;vertical-align:top;margin-right:{10 * zoom}px;">'
        f'{before_html}'
        '<span style="display:inline-block;vertical-align:top;text-align:center;">'
        f'<div style="height:{chord_size_px * 1.25 * zoom}px;font-size:{chord_size_px * zoom}px;">{above_html}</div>'
        f'<div style="font-size:{text_size_px * zoom}px;">{escape(word.text)}</div>'
        '</span>'
        f'{after_html}'
        '</span>'
    )


def _render_lyrics_words(lines: list, zoom: float, line_spacing_px: int, text_size_px: int, chord_size_px: int) -> str:
    rows = [
        f'<div style="margin-bottom:{line_spacing_px * zoom}px;">'
        f'{"".join(_word_html(word, zoom, text_size_px, chord_size_px) for word in line)}</div>'
        for line in lines
    ]
    return "".join(rows)


def render_sections_block(block, song, zoom: float) -> str:
    """A 'sections' block renders its own content directly, exactly like a chord grid renders
    its own rows -- lyrics_words lives on the block itself, so there's no more "which sections
    are assigned to this block" filtering to do."""
    if not block.lyrics_words:
        return ""
    return _render_lyrics_words(
        block.lyrics_words, zoom, song.lyrics_line_spacing_px, song.lyrics_text_size_px, song.lyrics_chord_size_px,
    )


def render_videos_block(song, zoom: float) -> str:
    if not song.videos:
        return ""
    items = []
    for index, video in enumerate(song.videos, start=1):
        title = escape(video.title or f"Video {index}")
        items.append(
            f'<div style="display:inline-block;vertical-align:top;text-align:center;width:{100 * zoom}px;'
            f'margin:0 {16 * zoom}px {12 * zoom}px 0;">'
            f'<img src="{qr_code_data_uri(video.url)}" style="width:{80 * zoom}px;height:{80 * zoom}px;" />'
            f'<div style="font-size:{11 * zoom}px;color:{_LABEL_COLOR};">{title}</div>'
            '</div>'
        )
    return f'<div>{"".join(items)}</div>'


def render_labels_block(song, label_details: dict, zoom: float) -> str:
    if not song.label_ids:
        return ""
    chips = []
    for label_id in song.label_ids:
        label = label_details.get(label_id)
        if not label:
            continue
        chips.append(
            f'<span style="display:inline-block;border-radius:{10 * zoom}px;padding:{2 * zoom}px {8 * zoom}px;'
            f'margin:0 {6 * zoom}px {6 * zoom}px 0;font-size:{11 * zoom}px;border:1px solid {escape(label["color"])};'
            f'color:{escape(label["color"])};">{escape(label["name"])}</span>'
        )
    return f'<div>{"".join(chips)}</div>'


BLOCK_RENDERERS = {
    "title": render_title_block,
    "author": render_author_block,
    "tempo": render_tempo_block,
    "time_signature": render_time_signature_block,
    "capo": render_capo_block,
    "description": render_description_block,
    "videos": render_videos_block,
}
