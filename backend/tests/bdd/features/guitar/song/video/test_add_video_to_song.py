import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.video.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../../features/features/guitar/song/video/add_video_to_song.feature"


@scenario(FEATURE, "POST a video onto a song — it lands at the next position")
def test_add_video_to_song():
    pass


@scenario(FEATURE, "POST a second video onto the same song — it lands after the first")
def test_add_second_video():
    pass


@scenario(FEATURE, "POST a video with a non-http(s) URL — 422 and the database is not modified")
def test_add_video_invalid_url():
    pass


@scenario(FEATURE, "POST a video as a guest — 403 and the database is not modified")
def test_add_video_as_guest():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
