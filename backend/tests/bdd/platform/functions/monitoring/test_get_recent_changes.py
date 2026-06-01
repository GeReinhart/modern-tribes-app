from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.functions.monitoring.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, _make_mock_pool

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/platform/functions")

FEATURE = "../../../../features/platform/functions/monitoring/get_recent_changes.feature"

@scenario(FEATURE, "GET /monitoring/recent-changes as admin — recent changes are returned")
def test_get_recent_changes_admin():
    pass

@scenario(FEATURE, "GET /monitoring/recent-changes as a viewer — 403 error")
def test_get_recent_changes_forbidden():
    pass

@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.functions.monitoring.router.get_database", return_value=_make_mock_pool()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.platform.functions.monitoring.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
