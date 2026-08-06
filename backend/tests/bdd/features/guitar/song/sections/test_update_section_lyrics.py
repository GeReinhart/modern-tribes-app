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

FEATURE = "../../../../../features/features/guitar/song/sections/update_section_lyrics.feature"


@scenario(FEATURE, "PATCH lyrics text onto a section with no words yet — the text is tokenized into words")
def test_update_lyrics_tokenizes():
    pass


@scenario(FEATURE, "PATCH lyrics text with 3 spaces between two words — an empty chord-only slot is inserted")
def test_update_lyrics_empty_slot():
    pass


@scenario(FEATURE, "PATCH lyrics text replacing one word — only that word's chords are lost, the rest survive")
def test_update_lyrics_preserves_unrelated_chords():
    pass


@scenario(FEATURE, "PATCH the lyrics of a chords-only section — 409 and the database is not modified")
def test_update_lyrics_on_chords_only_section():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
