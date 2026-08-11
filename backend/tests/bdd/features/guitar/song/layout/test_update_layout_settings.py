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

FEATURE = "../../../../../features/features/guitar/song/layout/update_layout_settings.feature"


@scenario(FEATURE, "PATCH the page margins — they are updated")
def test_update_layout_settings():
    pass


@scenario(FEATURE, "PATCH the footer spacing — it is updated, margins stay the same")
def test_update_layout_settings_footer_spacing():
    pass


@scenario(FEATURE, "PATCH the page margins as a project guest — 403 and the database is not modified")
def test_update_layout_settings_as_guest():
    pass


@scenario(FEATURE, "PATCH a margin out of range — 422 and the database is not modified")
def test_update_layout_settings_out_of_range():
    pass


@scenario(FEATURE, "PATCH a footer spacing greater than or equal to the bottom margin — 422 and the database is not modified")
def test_update_layout_settings_footer_spacing_too_large():
    pass


@scenario(
    FEATURE,
    "PATCH both the bottom margin and the footer spacing in the same request, spacing left too large for the new margin — 422 and the database is not modified",
)
def test_update_layout_settings_footer_spacing_vs_new_margin():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
