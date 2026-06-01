from datetime import datetime
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

FEATURE = "../../../../features/platform/tools/notifications/update_notification_status.feature"

_FAKE_NOTIFICATION = {
    "id": "00000000-0000-0000-0000-000000000010",
    "url_param_id": "abc123",
    "target_user_id": "00000000-0000-0000-0000-000000000001",
    "message": "Test notification",
    "sent_at": None,
    "notification_status": "sent",
    "created_at": datetime(2024, 1, 1),
}


@scenario(FEATURE, "PATCH /notifications/0010/status as admin — notification status is updated")
def test_update_notification_admin():
    pass

@scenario(FEATURE, "PATCH /notifications/0010/status as a regular user — notification status is updated")
def test_update_notification_regular():
    pass

@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.tools.notifications.router.get_database", return_value=MagicMock()),
        patch("app.platform.tools.notifications.service.report_status", new=AsyncMock(return_value=_FAKE_NOTIFICATION)),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.tools.notifications.router.get_database", return_value=MagicMock()),
        patch("app.platform.tools.notifications.service.report_status", new=AsyncMock(return_value=_FAKE_NOTIFICATION)),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
