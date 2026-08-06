import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.label_router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../../features/features/guitar/song/labels/manage_song_labels.feature"


@scenario(FEATURE, "Manager creates a song label for the project")
def test_create_song_label():
    pass


@scenario(FEATURE, "GET a project's song labels — only its own labels are listed")
def test_list_song_labels():
    pass


@scenario(FEATURE, "Member attaches a label to a song — it appears in the song's label_ids")
def test_attach_song_label():
    pass


@scenario(FEATURE, "Member (not manager) tries to create a song label — 403 error and nothing is created")
def test_create_song_label_forbidden():
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
