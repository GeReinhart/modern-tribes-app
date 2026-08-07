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
from html import escape

from app.features.guitar.song.layout.chord_diagram_html import (
    compute_window_size,
    diagram_pixel_width,
    render_chord_diagram_html,
)
from app.features.guitar.song.layout.qr_code import qr_code_data_uri

_LABEL_COLOR = "#1a1a1a"
_SECONDARY_COLOR = "#666666"
_BASE_FONT_SIZE = 16

# Mirrors the frontend's TITLE_EDITABLE_BLOCK_TYPES (layoutBlockOptions.ts) -- title/author/
# tempo/time_signature/capo show the song's own value, not a separate editable label, so they
# never get a title line here either.
_TITLE_BLOCK_TYPES = {"chords", "sections", "custom", "videos", "labels", "description"}
# Chords, sections and videos show a default label out of the box; custom/labels/description
# default to no title at all (block.custom_title stays None) until the user names them.
_DEFAULT_BLOCK_TITLES = {"chords": "Chords", "sections": "Lyrics & Chords", "videos": "Videos"}
_HEADING_SIZES_PX = {"h1": 24, "h2": 20, "h3": 16, "h4": 13}


def render_block_title(block, zoom: float) -> str:
    if block.block_type not in _TITLE_BLOCK_TYPES:
        return ""
    title = block.custom_title if block.custom_title is not None else _DEFAULT_BLOCK_TITLES.get(block.block_type, "")
    if not title:
        return ""
    size_px = _HEADING_SIZES_PX[block.title_heading_level]
    return (
        f'<div style="font-weight:700;font-size:{size_px * zoom}px;color:{_LABEL_COLOR};'
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


def _wrap_freeform_html(content_html: str, zoom: float) -> str:
    if not content_html:
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


def render_chords_block(song, zoom: float) -> str:
    if not song.chords:
        return ""
    shared_window_size = max(compute_window_size(sc.chord.frets) for sc in song.chords)
    card_width = diagram_pixel_width(song.chord_diagram_size, zoom)
    items = []
    for song_chord in song.chords:
        chord = song_chord.chord
        comment = (
            f'<div style="font-size:{11 * zoom}px;font-style:italic;color:{_SECONDARY_COLOR};">'
            f"{escape(song_chord.comment)}</div>"
            if song_chord.comment else ""
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
    above = [c for c in (word.chord_start, word.chord_middle, word.chord_end) if c]
    above_html = " ".join(_chord_badge(c, zoom, chord_size_px) for c in above)
    before_html = (
        f'<span style="display:inline-block;vertical-align:top;">'
        f'{_chord_badge(word.chord_before, zoom, chord_size_px)}</span> '
        if word.chord_before else ""
    )
    after_html = (
        f' <span style="display:inline-block;vertical-align:top;">'
        f'{_chord_badge(word.chord_after, zoom, chord_size_px)}</span>'
        if word.chord_after else ""
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


def _render_lyrics_section(section, zoom: float, line_spacing_px: int, text_size_px: int, chord_size_px: int) -> str:
    lines: dict[int, list] = {}
    for word in section.words:
        lines.setdefault(word.line_index, []).append(word)
    ordered_lines = [lines[key] for key in sorted(lines.keys())]
    rows = []
    for line_words in ordered_lines:
        line_words_sorted = sorted(line_words, key=lambda w: w.word_index)
        rows.append(
            f'<div style="margin-bottom:{line_spacing_px * zoom}px;">'
            f'{"".join(_word_html(w, zoom, text_size_px, chord_size_px) for w in line_words_sorted)}</div>'
        )
    return "".join(rows)


def _render_chords_only_section(section, zoom: float, chord_size_px: int) -> str:
    chords_sorted = sorted(section.chords, key=lambda c: c.position)
    badges = " ".join(_chord_badge(c.chord, zoom, chord_size_px) for c in chords_sorted)
    return f'<div>{badges}</div>'


def render_sections_block(song, block, is_first_sections_block: bool, zoom: float) -> str:
    # A 'sections' block only shows what's explicitly assigned to it -- except an unassigned
    # section, which falls back to whichever 'sections' block is first in the layout, never to
    # nowhere. Mirrors the web view's rule (songLayoutCollectionBlocks.tsx's renderSectionsBlock)
    # so a song with 2+ Lyrics & Chords blocks doesn't repeat every section into every one of them.
    visible_sections = [
        section for section in song.sections
        if section.layout_block_id == block.id or (section.layout_block_id is None and is_first_sections_block)
    ]
    if not visible_sections:
        return ""
    parts = []
    for section in visible_sections:
        body = (
            _render_lyrics_section(
                section, zoom, song.lyrics_line_spacing_px, song.lyrics_text_size_px, song.lyrics_chord_size_px,
            ) if section.content_mode == "lyrics"
            else _render_chords_only_section(section, zoom, song.lyrics_chord_size_px)
        )
        parts.append(
            f'<div style="margin-bottom:{16 * zoom}px;">'
            f'<div style="font-weight:700;font-size:{15 * zoom}px;color:{_LABEL_COLOR};margin-bottom:{6 * zoom}px;">'
            f'{escape(section.display_label)}</div>{body}</div>'
        )
    return "".join(parts)


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
    "chords": render_chords_block,
    "videos": render_videos_block,
}
