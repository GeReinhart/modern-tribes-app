import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.features.bookmarks.router import router
from app.features.bookmarks.models import UserBookmarkItem, UserBookmarksResponse
from tests.conftest import _ADMIN_USER, _REGULAR_USER, _PROFILE_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features")

FEATURE = "../../../features/features/bookmarks/add_bookmark.feature"

@scenario(FEATURE, "POST /bookmarks with valid body as viewer — the bookmark is created")
def test_add_bookmark_viewer():
    pass

@scenario(FEATURE, "POST /bookmarks as a user with no app access — 403 error")
def test_add_bookmark_forbidden():
    pass

@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()

@pytest.fixture
def profile_owner_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _PROFILE_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
