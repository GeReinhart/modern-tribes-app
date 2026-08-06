"""Plain unit tests (no DB) for a 'custom' ("free text") block's PDF rendering, in particular
the title/body visibility rule -- mirrors test_pdf_chord_grid.py's approach."""
from types import SimpleNamespace

from app.features.guitar.song.layout.pdf_service import _render_block_wrapper


def _block(custom_title=None, custom_content_html="") -> SimpleNamespace:
    return SimpleNamespace(
        block_type="custom", custom_title=custom_title, custom_content_html=custom_content_html,
        title_heading_level="h3", zoom_percent=100, show_card=False, width_twelfths=12,
        padding_top_mm=0, padding_right_mm=0, padding_bottom_mm=0, padding_left_mm=0,
    )


def _render(block) -> str:
    return _render_block_wrapper(block, SimpleNamespace(chords=[]), {}, 12)


def test_title_only_custom_block_still_renders_its_title():
    """A 'custom' block with a title but no body is a valid, meaningful state on screen
    (songLayoutBlockContentDispatch.tsx shows title and body independently) -- it must not
    disappear from the PDF just because its body is empty."""
    html = _render(_block(custom_title="My Title Only", custom_content_html=""))
    assert "My Title Only" in html


def test_body_only_custom_block_still_renders_its_body():
    html = _render(_block(custom_title=None, custom_content_html="<p>Some notes</p>"))
    assert "Some notes" in html


def test_fully_empty_custom_block_renders_nothing():
    assert _render(_block(custom_title=None, custom_content_html="")) == ""


def test_blank_rich_text_title_only_block_still_renders_its_title():
    """The rich-text editor saves an empty paragraph, not an empty string, for "no body typed"
    -- that must still count as "no body" for this rule, same as chord_grid's own blank check."""
    html = _render(_block(custom_title="My Title Only", custom_content_html="<p><br></p>"))
    assert "My Title Only" in html


def test_image_only_body_renders_the_image_not_blank():
    """An embedded image with no surrounding text strips to empty text, but is NOT blank --
    it must still render, unlike an empty paragraph."""
    html = _render(_block(custom_title=None, custom_content_html='<p><img src="/uploads/photo.png" /></p>'))
    assert "<img" in html


def test_image_only_body_with_a_title_renders_both():
    html = _render(_block(custom_title="Photo", custom_content_html='<img src="/uploads/photo.png" />'))
    assert "Photo" in html
    assert "<img" in html
