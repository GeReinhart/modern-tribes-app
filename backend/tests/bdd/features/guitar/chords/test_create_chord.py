import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.chords.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/guitar/chords/create_chord.feature"


@scenario(FEATURE, "POST /guitar/chords/ with a valid shape — the chord is created and the root note is proposed from the name")
def test_create_chord_proposed_root():
    pass


@scenario(FEATURE, "POST /guitar/chords/ with an explicit root_note — the proposed root is overridden")
def test_create_chord_explicit_root():
    pass


@scenario(FEATURE, "POST /guitar/chords/ with a muted string — \"X\" is accepted alongside fret numbers")
def test_create_chord_muted_string():
    pass


@scenario(FEATURE, "POST /guitar/chords/ with a fret out of range — 422 error and the database is not modified")
def test_create_chord_fret_out_of_range():
    pass


@scenario(FEATURE, "POST /guitar/chords/ with fewer than 6 strings — 422 error and the database is not modified")
def test_create_chord_wrong_string_count():
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
