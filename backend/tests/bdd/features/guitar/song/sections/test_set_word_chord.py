import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.sections.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../../features/features/guitar/song/sections/set_word_chord.feature"


@scenario(FEATURE, "PATCH a word's \"start\" chord — it is attached and the chord joins the song's own chord list")
def test_set_word_chord_attaches_and_links():
    pass


@scenario(FEATURE, "PATCH two different positions on the same word — both chords coexist")
def test_set_word_chord_two_positions():
    pass


@scenario(
    FEATURE,
    "PATCH a word's chord when the chord is already in the song's chord list — no duplicate is created",
)
def test_set_word_chord_no_duplicate_link():
    pass


@scenario(
    FEATURE,
    "PATCH a word's chord to null — the chord is detached from that position but stays in the song's chord list",
)
def test_set_word_chord_detach():
    pass


@scenario(FEATURE, "PATCH a chord onto an empty word slot — a chord-only gap can carry a chord too")
def test_set_word_chord_empty_slot():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
