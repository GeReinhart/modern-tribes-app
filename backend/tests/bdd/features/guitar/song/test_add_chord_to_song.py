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

FEATURE = "../../../../features/features/guitar/song/add_chord_to_song.feature"


@scenario(FEATURE, "POST a chord onto a song as a member — the chord is linked at the next position")
def test_add_chord_as_member():
    pass


@scenario(FEATURE, "POST a second chord onto the same song — it is linked at the next position after the first")
def test_add_second_chord():
    pass


@scenario(FEATURE, "POST the same chord onto the same song twice — 409 error and the database is not modified")
def test_add_duplicate_chord():
    pass


@scenario(FEATURE, "POST a chord onto a song as a guest — 403 error and the database is not modified")
def test_add_chord_as_guest():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
