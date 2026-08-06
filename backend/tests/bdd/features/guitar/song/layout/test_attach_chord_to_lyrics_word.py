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

FEATURE = "../../../../../features/features/guitar/song/layout/attach_chord_to_lyrics_word.feature"


@scenario(FEATURE, "PATCH a chord at 'start' on a word — it resolves from the shared chord inventory")
def test_attach_chord_resolves_from_inventory():
    pass


@scenario(FEATURE, "PATCH two different positions on the same word — both coexist")
def test_attach_two_positions_on_same_word():
    pass


@scenario(FEATURE, "PATCH with chord_id null — the word is detached, the block loses that chord attachment")
def test_detach_word_chord():
    pass


@scenario(FEATURE, "PATCH a chord onto an empty word slot — it attaches like any other word")
def test_attach_chord_to_empty_slot():
    pass


@scenario(FEATURE, "PATCH a word coordinate out of range — 404 and nothing changes")
def test_attach_chord_out_of_range_coordinate():
    pass


@scenario(FEATURE, "PATCH a word chord on a block with no lyrics set up yet — 404 and nothing changes")
def test_attach_word_chord_on_unconfigured_block_is_rejected():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
