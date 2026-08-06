import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.sections.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../../features/features/guitar/song/sections/add_chord_to_section.feature"


@scenario(
    FEATURE,
    "POST a chord onto a chords-only section — it lands at the next position and joins the song's chord list",
)
def test_add_chord_to_section():
    pass


@scenario(
    FEATURE,
    "POST the same chord twice onto a chords-only section — repeats are allowed, each at its own position",
)
def test_add_same_chord_twice():
    pass


@scenario(
    FEATURE,
    "DELETE a chord from a chords-only section — it is removed from the section but stays in the song's chord list",
)
def test_remove_chord_from_section():
    pass


@scenario(FEATURE, "POST a chord onto a lyrics-mode section — 409 and the database is not modified")
def test_add_chord_to_lyrics_section():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
