from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.bookmarks.router import router
from app.features.bookmarks.models import UserBookmarkItem, UserBookmarksResponse
from tests.conftest import _ADMIN_USER, _REGULAR_USER, _PROFILE_USER

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/features")

FEATURE = "../../../features/features/bookmarks/list_bookmarks.feature"

@scenario(FEATURE, "GET /bookmarks as viewer — bookmarks are returned")
def test_list_bookmarks_viewer():
    pass

@scenario(FEATURE, "GET /bookmarks as a user with no app access — 403 error")
def test_list_bookmarks_forbidden():
    pass

@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.features.bookmarks.router.get_database", return_value=MagicMock()),
        patch("app.features.bookmarks.router.user_bookmarks_service.get_bookmarks",
              new=AsyncMock(return_value=UserBookmarksResponse(bookmarks=[]))),
        patch("app.features.bookmarks.router.user_bookmarks_service.add_bookmark",
              new=AsyncMock(return_value=UserBookmarkItem(id="bm1", page_path="/tribes/abc", page_title="Eng", display_order=1))),
        patch("app.features.bookmarks.router.user_bookmarks_service.update_bookmark",
              new=AsyncMock(return_value=UserBookmarkItem(id="bm1", page_path="/tribes/abc", page_title="Updated", display_order=1))),
        patch("app.features.bookmarks.router.user_bookmarks_service.remove_bookmark",
              new=AsyncMock(return_value=None)),
        patch("app.features.bookmarks.router.user_bookmarks_service.reorder_bookmarks",
              new=AsyncMock(return_value=UserBookmarksResponse(bookmarks=[]))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def profile_owner_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _PROFILE_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_manage_own_profile"])),
        patch("app.features.bookmarks.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
