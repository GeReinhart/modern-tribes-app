from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.dashboard.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, _PROFILE_USER

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/features")

FEATURE = "../../../features/features/dashboard/get_dashboard.feature"


@scenario(FEATURE, "GET /dashboard as viewer — dashboard is returned")
def test_get_dashboard_viewer():
    pass


@scenario(FEATURE, "GET /dashboard as a user with no app access — 403 error")
def test_get_dashboard_forbidden():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.features.dashboard.router.get_database", return_value=MagicMock()),
        patch("app.features.dashboard.repository.fetch_my_tasks_kanban", new=AsyncMock(return_value=[])),
        patch("app.features.dashboard.repository.fetch_my_tasks_todo", new=AsyncMock(return_value=[])),
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
        patch("app.features.dashboard.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
