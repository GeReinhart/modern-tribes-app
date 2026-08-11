"""Plain unit tests (no DB) for how a 'sections' block renders itself into the PDF now that it
owns its content directly -- lyrics_words lives on the block, so there's no more "which sections
are assigned to this block" filtering/fallback to exercise (see the deleted
app/features/guitar/song/sections/ package). These exercise pure HTML-string-building functions,
so a full BDD/DB harness would add nothing -- rendered HTML isn't practically assertable from a
black-box "is this a valid PDF" test."""
from types import SimpleNamespace

from app.features.guitar.song.layout.pdf_blocks import render_block_title, render_sections_block
from app.features.guitar.song.layout.pdf_service import _render_block_wrapper, _render_row

_SONG = SimpleNamespace(lyrics_line_spacing_px=10, lyrics_text_size_px=16, lyrics_chord_size_px=18)


def _chord(chord_id: str, name: str) -> SimpleNamespace:
    return SimpleNamespace(id=chord_id, name=name)


def _word(text: str, chords: dict | None = None) -> SimpleNamespace:
    return SimpleNamespace(text=text, chords=chords or {})


def _block(block_id: str, **overrides) -> SimpleNamespace:
    defaults = dict(
        id=block_id, block_type="sections", zoom_percent=100, show_card=False, width_twelfths=12,
        padding_top_mm=0, padding_right_mm=0, padding_bottom_mm=0, padding_left_mm=0,
        custom_title=None, title_heading_level="h3", lyrics_words=None,
    )
    return SimpleNamespace(**{**defaults, **overrides})


def _row(blocks: list) -> SimpleNamespace:
    column = SimpleNamespace(
        position=1, width_twelfths=12, align="left", blocks=blocks,
        padding_top_mm=0, padding_right_mm=0, padding_bottom_mm=0, padding_left_mm=0,
        separator_left=False, separator_right=False,
    )
    return SimpleNamespace(position=1, page_break_before=False, columns=[column])


def test_lyrics_block_renders_its_own_words_and_chords():
    block = _block("block-a", lyrics_words=[[_word("Hello", {"start": _chord("c1", "Em7")}), _word("world")]])
    html = render_sections_block(block, _SONG, 1.0)
    assert "Hello" in html
    assert "world" in html
    assert "Em7" in html


def test_a_block_with_no_lyrics_yet_renders_nothing():
    block = _block("block-a")
    assert render_sections_block(block, _SONG, 1.0) == ""


def test_two_sections_blocks_in_the_same_row_each_render_only_their_own_content():
    """The old bug this replaces: with 2+ 'sections' blocks sharing an assignable pool of
    sections, rendering the row could render the same section into more than one block. Now
    each block only ever has its own content, so nothing can leak across blocks."""
    block_a = _block("block-a", lyrics_words=[[_word("Couplet 1")]])
    block_b = _block("block-b", lyrics_words=[[_word("Refrain")]])
    html = _render_row(_row([block_a, block_b]), _SONG, {})
    assert html.count("Couplet 1") == 1
    assert html.count("Refrain") == 1


def test_sections_block_with_no_custom_title_prints_no_default_title():
    """Unlike chords/videos/chord_grid, a 'sections' block never had a generic default title --
    it's the one place a section-owned title used to live; now the block's own custom_title is
    the only title, so an unnamed block prints none at all."""
    block = _block("block-a", lyrics_words=[[_word("Hello")]])
    assert render_block_title(block, 1.0) == ""


def test_a_block_with_no_lyrics_yet_wraps_to_nothing_at_all():
    """Mirrors the web read view's rule: an empty block shows no title either, so a default
    label never prints above blank content."""
    block = _block("block-a")
    assert _render_block_wrapper(block, _SONG, {}, column_width_twelfths=12) == ""
