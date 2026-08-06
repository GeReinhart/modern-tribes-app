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

FEATURE = "../../../../../features/features/guitar/song/layout/update_block_lyrics.feature"


@scenario(FEATURE, "Editing lyrics text keeps the chord on a word that only shifted position")
def test_edit_lyrics_keeps_shifted_word_chord():
    pass


@scenario(FEATURE, "Editing lyrics text drops the chord on a word that changed, keeps it on words that didn't")
def test_edit_lyrics_drops_changed_word_chord():
    pass


@scenario(FEATURE, "Editing lyrics text keeps a chord attached to an empty strum slot")
def test_edit_lyrics_keeps_empty_slot_chord():
    pass


@scenario(
    FEATURE,
    "Editing lyrics text on a block that links to another — the edit lands on the target, not the link",
)
def test_edit_lyrics_through_link_lands_on_target():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
