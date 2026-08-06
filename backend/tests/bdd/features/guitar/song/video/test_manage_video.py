import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.video.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../../features/features/guitar/song/video/manage_video.feature"


@scenario(FEATURE, "PATCH a video's title — it is updated")
def test_update_video_title():
    pass


@scenario(FEATURE, "Manager moves the second video up — it swaps position with the first")
def test_move_video_up():
    pass


@scenario(FEATURE, "Manager removes a video — it is archived")
def test_remove_video():
    pass


@scenario(FEATURE, "Member (not manager) tries to remove a video — 403 error and it stays active")
def test_remove_video_forbidden():
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
