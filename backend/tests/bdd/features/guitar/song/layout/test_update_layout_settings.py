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


@scenario(FEATURE, "PATCH the page margins as a project guest — 403 and the database is not modified")
def test_update_layout_settings_as_guest():
    pass


@scenario(FEATURE, "PATCH a margin out of range — 422 and the database is not modified")
def test_update_layout_settings_out_of_range():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
