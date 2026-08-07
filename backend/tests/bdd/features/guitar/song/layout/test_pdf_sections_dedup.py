"""Plain unit tests (no DB) for the PDF rendering rule that a 'sections' block only shows the
sections assigned to it, mirroring the web view's songLayoutCollectionBlocks.tsx rule. These
exercise pure HTML-string-building functions, so a full BDD/DB harness would add nothing --
duplicated lyrics text in the generated PDF isn't practically assertable from a black-box
"is this a valid PDF" test."""
from types import SimpleNamespace

from app.features.guitar.song.layout.pdf_blocks import render_sections_block
from app.features.guitar.song.layout.pdf_service import _first_sections_block_id, _render_row


def _section(section_id: str, label: str, layout_block_id: str | None) -> SimpleNamespace:
    return SimpleNamespace(
        id=section_id, display_label=label, content_mode="lyrics", words=[], layout_block_id=layout_block_id,
    )


def _sections_block(block_id: str) -> SimpleNamespace:
    return SimpleNamespace(
        id=block_id, block_type="sections", zoom_percent=100, show_card=False, width_eighths=8,
        custom_title=None, title_heading_level="h3",
    )


def _row(position: int, blocks: list, width_eighths: int = 8) -> SimpleNamespace:
    column = SimpleNamespace(
        position=1, width_eighths=width_eighths, align="left", blocks=blocks,
        padding_top_mm=0, padding_right_mm=0, padding_bottom_mm=0, padding_left_mm=0,
    )
    return SimpleNamespace(position=position, page_break_before=False, columns=[column])


def test_unassigned_section_falls_back_to_first_sections_block():
    block_a, block_b = _sections_block("block-a"), _sections_block("block-b")
    song = SimpleNamespace(
        sections=[_section("s1", "Couplet 1", None)],
        layout=SimpleNamespace(rows=[_row(1, [block_a]), _row(2, [block_b])]),
        lyrics_line_spacing_px=10, lyrics_text_size_px=16, lyrics_chord_size_px=18,
    )
    assert _first_sections_block_id(song) == "block-a"
    assert "Couplet 1" in render_sections_block(song, block_a, True, 1.0)
    assert "Couplet 1" not in render_sections_block(song, block_b, False, 1.0)


def test_two_sections_blocks_in_the_same_row_do_not_duplicate_a_section():
    """The exact bug: with 2+ 'sections' blocks, rendering the whole row used to render every
    section into every one of them instead of only the block it's assigned to."""
    block_a, block_b = _sections_block("block-a"), _sections_block("block-b")
    song = SimpleNamespace(
        sections=[_section("s1", "Couplet 1", "block-a"), _section("s2", "Refrain", "block-b")],
        layout=SimpleNamespace(rows=[_row(1, [block_a, block_b])]),
        lyrics_line_spacing_px=10, lyrics_text_size_px=16, lyrics_chord_size_px=18,
    )
    html = _render_row(song.layout.rows[0], song, {})
    assert html.count("Couplet 1") == 1
    assert html.count("Refrain") == 1
