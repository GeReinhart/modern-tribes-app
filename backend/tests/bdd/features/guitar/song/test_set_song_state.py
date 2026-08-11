import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.router import router as song_router
from app.features.guitar.song.layout.router import router as layout_router
from app.features.guitar.song.label_router import router as label_router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(song_router, prefix="/api/features/tasks")
_test_app.include_router(layout_router, prefix="/api/features/tasks")
_test_app.include_router(label_router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/guitar/song/set_song_state.feature"


@scenario(FEATURE, "PATCH song_state from draft to completed as a member — it succeeds")
def test_song_state_draft_to_completed():
    pass


@scenario(FEATURE, "PATCH song_state from completed back to draft as a member — it succeeds")
def test_song_state_completed_to_draft():
    pass


@scenario(FEATURE, "PATCH a content field (title) on a completed song — 409 error and the database is not modified")
def test_song_state_completed_blocks_content_edit():
    pass


@scenario(FEATURE, "PATCH song_state together with a content field on a completed song — 409 error, nothing changes")
def test_song_state_completed_blocks_bundled_edit():
    pass


@scenario(FEATURE, "POST a new layout row on a completed song — 409 error and the layout is not modified")
def test_song_state_completed_blocks_layout_edit():
    pass


@scenario(FEATURE, "Attach a label to a completed song — it succeeds even though the song is completed")
def test_song_state_completed_allows_label_attach():
    pass


@scenario(FEATURE, "Detach a label from a completed song — it succeeds even though the song is completed")
def test_song_state_completed_allows_label_detach():
    pass


@scenario(FEATURE, "Archive a completed song — it succeeds even though the song is completed")
def test_song_state_completed_allows_archive():
    pass


@scenario(FEATURE, "PATCH song_state as a guest — 403 error and the database is not modified")
def test_song_state_forbidden_for_guest():
    pass


@scenario(FEATURE, "PATCH song_state with an invalid value — 422 error and the database is not modified")
def test_song_state_invalid_value():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
