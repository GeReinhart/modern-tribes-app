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

FEATURE = "../../../../features/platform/core/authentication/delete_session.feature"

@scenario(FEATURE, "DELETE /authentication/sessions/0010 as admin — session is deleted")
def test_delete_session_admin():
    pass

@scenario(FEATURE, "DELETE /authentication/sessions/0010 as a regular user — session is deleted")
def test_delete_session_regular():
    pass

@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authentication.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authentication.repository.delete_session", new=AsyncMock(return_value=None)),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authentication.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authentication.repository.delete_session", new=AsyncMock(return_value=None)),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
