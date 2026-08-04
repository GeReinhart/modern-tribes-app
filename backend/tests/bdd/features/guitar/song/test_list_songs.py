import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/guitar/song/list_songs.feature"


@scenario(FEATURE, "GET songs through one guitar_song tab — the project's active songs are returned")
def test_list_songs_via_first_tab():
    pass


@scenario(FEATURE, "GET songs through a second guitar_song tab of the same project — the same songs are returned")
def test_list_songs_via_second_tab():
    pass


@scenario(FEATURE, "GET songs as a guest — read access is allowed")
def test_list_songs_as_guest():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
