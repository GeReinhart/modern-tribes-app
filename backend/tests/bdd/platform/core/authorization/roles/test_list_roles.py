from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.roles.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/platform/core/authorization")

FEATURE = "../../../../../features/platform/core/roles/list_roles.feature"


@scenario(FEATURE, "GET /roles/ as admin — roles are returned")
def test_list_admin():
    pass


@scenario(FEATURE, "GET /roles/ as a viewer — 403 error")
def test_list_forbidden():
    pass

@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.core.authorization.roles.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.roles.router.get_all_documents",
              new=AsyncMock(return_value=[])),
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
        patch("app.platform.core.authorization.roles.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
