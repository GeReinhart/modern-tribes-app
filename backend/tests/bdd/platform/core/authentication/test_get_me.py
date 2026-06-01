from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authentication.router import router as auth_router
from tests.conftest import _ADMIN_USER, _REGULAR_USER

_test_app = FastAPI()
_test_app.include_router(auth_router, prefix="/api/platform/core")

FEATURE = "../../../../features/platform/core/authentication/get_me.feature"

_ADMIN_USER_FULL = {**_ADMIN_USER, "created_at": datetime(2024, 1, 1), "language": "en"}
_REGULAR_USER_FULL = {**_REGULAR_USER, "created_at": datetime(2024, 1, 1), "language": "en"}


@scenario(FEATURE, "GET /authentication/me as admin — profile is returned")
def test_get_me_admin():
    pass

@scenario(FEATURE, "GET /authentication/me as a regular user — profile is returned")
def test_get_me_regular():
    pass

@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER_FULL
    with (
        patch("app.platform.core.authentication.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authentication.router.get_user_permissions", new=AsyncMock(return_value=["admin"])),
        patch("app.platform.core.authentication.repository.get_user_roles", new=AsyncMock(return_value=[])),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER_FULL
    with (
        patch("app.platform.core.authentication.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authentication.router.get_user_permissions", new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.platform.core.authentication.repository.get_user_roles", new=AsyncMock(return_value=[])),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
