"""Plain unit tests (no DB) confirming a heading typed into free-form rich text (description/
custom/chord grid comment) renders at the exact same size as a block's own title at that level in
the PDF -- WeasyPrint's default heading scale otherwise looks nothing like it. See the frontend's
SongFreeformHtml.tsx for the same fix on screen."""
from types import SimpleNamespace

from app.features.guitar.song.layout.pdf_blocks import FREEFORM_HEADING_CSS, _HEADING_SIZES_PX, _LABEL_COLOR, _BASE_FONT_SIZE
from app.features.guitar.song.layout.pdf_service import _build_html_document

_SETTINGS = SimpleNamespace(margin_top_mm=10, margin_right_mm=10, margin_bottom_mm=10, margin_left_mm=10)
_SONG = SimpleNamespace(title="Wonderwall", author="Oasis", layout=SimpleNamespace(settings=_SETTINGS, rows=[]))


def test_freeform_heading_css_matches_block_title_sizes_in_em():
    for level, size_px in _HEADING_SIZES_PX.items():
        assert f".freeform {level} {{ font-size: {size_px / _BASE_FONT_SIZE}em;" in FREEFORM_HEADING_CSS
        assert f".freeform {level} {{" in FREEFORM_HEADING_CSS
    assert FREEFORM_HEADING_CSS.count(f"color: {_LABEL_COLOR}") == len(_HEADING_SIZES_PX)
    # H5 is non-bold and italic instead of bold, same toned-down treatment as a block's own h5
    # title (render_block_title) -- so it's excluded from the bold count and included in italic.
    assert FREEFORM_HEADING_CSS.count("font-weight: 700") == len(_HEADING_SIZES_PX) - 1
    assert FREEFORM_HEADING_CSS.count("font-style: italic;") == 1


def test_build_html_document_includes_the_freeform_heading_stylesheet():
    html = _build_html_document(_SONG, {})
    assert FREEFORM_HEADING_CSS in html
