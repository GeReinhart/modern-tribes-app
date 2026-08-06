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

FEATURE = "../../../../../features/features/guitar/song/sections/duplicate_section.feature"


@scenario(
    FEATURE,
    "POST duplicate on a lyrics-mode section — a new section is appended with the same lyrics and word-chord attachments",
)
def test_duplicate_lyrics_section():
    pass


@scenario(
    FEATURE,
    "POST duplicate on a chords-only section — a new section is appended with the same chord sequence",
)
def test_duplicate_chords_only_section():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
