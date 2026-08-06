import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.layout.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../../features/features/guitar/song/layout/download_layout_pdf.feature"


@scenario(FEATURE, "GET the PDF as a project guest — a valid PDF is returned")
def test_download_layout_pdf():
    pass


@scenario(FEATURE, "GET the PDF as an outsider — 403")
def test_download_layout_pdf_as_outsider():
    pass


@scenario(FEATURE, "GET the PDF twice with no changes — the second call reuses the cached copy")
def test_download_layout_pdf_uses_cache():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
