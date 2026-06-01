from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.roles.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, FakeRolesStore, _make_fake_check_document_exists

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/platform/core/authorization")

FEATURE = "../../../../../features/platform/core/roles/get_role_users.feature"

_FAKE_ROLE = {"id": "00000000-0000-0000-0000-000000000010", "name": "editor", "description": None, "permission_ids": [], "status": "active", "created_at": datetime(2024,1,1), "updated_at": datetime(2024,1,1), "created_by": None, "updated_by": None}


@scenario(FEATURE, "GET /roles/0010/users as admin — users are returned")
def test_get_role_users_admin():
    pass


@scenario(FEATURE, "GET /roles/0010/users as a viewer — 403 error")
def test_get_role_users_forbidden():
    pass


@pytest.fixture
def admin_client(managed_roles_store: FakeRolesStore):
    managed_roles_store.insert(_FAKE_ROLE)
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.core.authorization.roles.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.roles.router.check_document_exists",
              new=AsyncMock(side_effect=_make_fake_check_document_exists(managed_roles_store))),
        patch("app.platform.core.authorization.roles.router.get_all_documents", new=AsyncMock(return_value=[])),
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
