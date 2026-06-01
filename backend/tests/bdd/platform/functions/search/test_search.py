from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.functions.search.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, _PROFILE_USER

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/platform/functions")

FEATURE = "../../../../features/platform/functions/search/search.feature"


@scenario(FEATURE, "GET /search/?q=Alice as viewer — search results are returned")
def test_search_viewer():
    pass


@scenario(FEATURE, "GET /search/?q=Alice as a user with no app access — 403 error")
def test_search_forbidden():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.platform.functions.search.router.get_database", return_value=MagicMock()),
        patch("app.platform.functions.search.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.platform.functions.search.repository.search_user", new=AsyncMock(return_value=[])),
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
        patch("app.platform.functions.search.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
