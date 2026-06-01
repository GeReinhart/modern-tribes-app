from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.tools.notifications.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/platform/tools")

FEATURE = "../../../../features/platform/tools/notifications/get_pending_notifications.feature"

@scenario(FEATURE, "GET /notifications/pending as admin — pending notifications are returned")
def test_get_pending_admin():
    pass

@scenario(FEATURE, "GET /notifications/pending as a regular user — pending notifications are returned")
def test_get_pending_regular():
    pass

@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.tools.notifications.router.get_database", return_value=MagicMock()),
        patch("app.platform.tools.notifications.service.list_pending", new=AsyncMock(return_value=[])),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.tools.notifications.router.get_database", return_value=MagicMock()),
        patch("app.platform.tools.notifications.service.list_pending", new=AsyncMock(return_value=[])),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
