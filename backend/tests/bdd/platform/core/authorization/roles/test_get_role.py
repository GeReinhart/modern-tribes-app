from datetime import datetime
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

FEATURE = "../../../../../features/platform/core/roles/get_role.feature"

_DT = datetime(2024, 1, 1)

_FAKE = {"id": "00000000-0000-0000-0000-000000000010", "name": "editor", "description": None, "permission_ids": [], "status": "active", "created_at": _DT, "updated_at": _DT, "created_by": None, "updated_by": None}


@scenario(FEATURE, "GET /roles/0010 as admin — role is returned")
def test_get_admin():
    pass


@scenario(FEATURE, "GET /roles/0010 as a viewer — 403 error")
def test_get_forbidden():
    pass

@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.core.authorization.roles.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.roles.router.get_document_by_id",
              new=AsyncMock(return_value=_FAKE)),
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
