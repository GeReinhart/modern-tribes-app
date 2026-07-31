import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/guitar/song/reorder_song_chords.feature"


@scenario(FEATURE, "Manager moves the second chord up — it swaps position with the first")
def test_move_chord_prev():
    pass


@scenario(FEATURE, "Manager moves the second chord down — it swaps position with the third")
def test_move_chord_next():
    pass


@scenario(FEATURE, "Manager moves the first chord up — no-op, order is unchanged")
def test_move_chord_boundary_noop():
    pass


@scenario(FEATURE, "Member (not manager) tries to reorder — 403 error and the order is unchanged")
def test_move_chord_forbidden():
    pass


@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
