"""Plain unit tests (no DB) for rewriting locally-stored upload URLs to file:// paths before
handing the HTML to WeasyPrint -- see _localize_upload_urls's docstring in pdf_service.py for why
this is needed (WeasyPrint fetches <img src> itself and silently drops unreachable images)."""
from pathlib import Path

from app.platform.core.config import settings
from app.features.guitar.song.layout.pdf_service import _localize_upload_urls


def test_localize_upload_urls_rewrites_local_upload_url():
    upload_dir = Path(settings.UPLOAD_DIR).resolve()
    html = f'<img src="{settings.BASE_URL}/uploads/images/song.png" />'
    assert _localize_upload_urls(html) == f'<img src="file://{upload_dir}/images/song.png" />'


def test_localize_upload_urls_leaves_other_urls_untouched():
    html = '<img src="https://cellar-bucket.services.example.com/images/song.png" />'
    assert _localize_upload_urls(html) == html
