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

FEATURE = "../../../../features/features/guitar/song/set_song_difficulty.feature"


@scenario(FEATURE, "PATCH a song's difficulty as a member — it is updated")
def test_song_difficulty_updated():
    pass


@scenario(FEATURE, "PATCH a song's difficulty on a completed song — 409 error and the database is not modified")
def test_song_difficulty_locked_when_completed():
    pass


@scenario(FEATURE, "PATCH a song's difficulty out of range — 422 error and the database is not modified")
def test_song_difficulty_out_of_range():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
