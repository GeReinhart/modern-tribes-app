"""Plain unit tests (no DB) for the Chord Grid block's PDF rendering -- pure HTML-string-building
functions, so a full BDD/DB harness would add nothing over asserting on the generated markup
directly (mirrors test_pdf_sections_dedup.py's approach)."""
from types import SimpleNamespace

from app.features.guitar.song.layout.models import ChordGridCell, ChordGridCellItem
from app.features.guitar.song.layout.pdf_blocks import render_block_title, render_chord_grid_block


def _song_chord(chord_id: str, name: str) -> SimpleNamespace:
    return SimpleNamespace(chord=SimpleNamespace(id=chord_id, name=name))


def _block(rows, custom_title=None, custom_content_html=None, chord_grid_chord_size_px=18) -> SimpleNamespace:
    return SimpleNamespace(
        block_type="chord_grid", chord_grid_rows=rows, custom_title=custom_title,
        custom_content_html=custom_content_html, title_heading_level="h3",
        chord_grid_chord_size_px=chord_grid_chord_size_px,
    )


def test_cell_borders_render_only_the_enabled_sides():
    cell = ChordGridCell(border_top=True, border_left=True, items=[])
    row = [cell]
    html = render_chord_grid_block(_block([row]), SimpleNamespace(chords=[]), 1.0)
    assert "border-top:1px solid" in html
    assert "border-left:1px solid" in html
    assert "border-right" not in html
    assert "border-bottom" not in html


def test_cell_mixes_chord_and_text_items_in_order():
    cell = ChordGridCell(items=[
        ChordGridCellItem(item_type="chord", chord_id="c1"),
        ChordGridCellItem(item_type="chord", chord_id="c2"),
        ChordGridCellItem(item_type="text", text="x4"),
    ])
    song = SimpleNamespace(chords=[_song_chord("c1", "Em"), _song_chord("c2", "G")])
    html = render_chord_grid_block(_block([[cell]]), song, 1.0)
    em_index, g_index, x4_index = html.index("Em"), html.index("G"), html.index("x4")
    assert em_index < g_index < x4_index


def test_chord_not_found_in_song_is_silently_skipped():
    cell = ChordGridCell(items=[ChordGridCellItem(item_type="chord", chord_id="missing")])
    html = render_chord_grid_block(_block([[cell]]), SimpleNamespace(chords=[]), 1.0)
    assert "<td" in html and "</td>" in html


def test_empty_grid_falls_back_to_comment_only():
    html = render_chord_grid_block(
        _block(None, custom_content_html="<p>Notes</p>"), SimpleNamespace(chords=[]), 1.0,
    )
    assert "<table" not in html
    assert "Notes" in html


def test_blank_rich_text_comment_from_the_editor_renders_as_nothing():
    """The rich-text editor saves an empty paragraph, not an empty string, for "no comment
    typed" -- that must not still render a blank line."""
    html = render_chord_grid_block(
        _block(None, custom_content_html="<p><br></p>"), SimpleNamespace(chords=[]), 1.0,
    )
    assert html == ""


def test_default_title_shown_when_no_custom_title_set():
    assert "Chord Grid" in render_block_title(_block([[ChordGridCell()]]), 1.0)


def test_title_hidden_when_explicitly_cleared():
    assert render_block_title(_block([[ChordGridCell()]], custom_title=""), 1.0) == ""
