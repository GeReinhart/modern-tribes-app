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

FEATURE = "../../../../features/platform/core/authentication/get_sessions.feature"

@scenario(FEATURE, "GET /authentication/sessions as admin — sessions are returned")
def test_get_sessions_admin():
    pass

@scenario(FEATURE, "GET /authentication/sessions as a regular user — sessions are returned")
def test_get_sessions_regular():
    pass

@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authentication.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authentication.repository.get_active_sessions", new=AsyncMock(return_value=[])),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authentication.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authentication.repository.get_active_sessions", new=AsyncMock(return_value=[])),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
