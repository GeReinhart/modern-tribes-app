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

FEATURE = "../../../../../features/features/guitar/song/mastery/set_song_mastery.feature"


@scenario(FEATURE, "PUT my mastery on a song — it is saved and shown back to me")
def test_mastery_set():
    pass


@scenario(FEATURE, "PUT my mastery again with a new value — it is updated, not duplicated")
def test_mastery_upsert():
    pass


@scenario(FEATURE, "A guest (not just a member) can rate their own mastery too")
def test_mastery_guest_allowed():
    pass


@scenario(FEATURE, "A song I have never rated shows no mastery, even if I rated a different song")
def test_mastery_scoped_per_song():
    pass


@scenario(FEATURE, "PUT my mastery on a completed song — it succeeds even though the song is completed")
def test_mastery_exempt_from_completed_lock():
    pass


@scenario(FEATURE, "PUT my mastery with an out-of-range value — 422 error and nothing is saved")
def test_mastery_out_of_range():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
