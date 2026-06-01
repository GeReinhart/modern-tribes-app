from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.tools.mail.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/platform/tools")

FEATURE = "../../../../features/platform/tools/mail/get_mail.feature"

_DT = datetime(2024, 1, 1)

_FAKE = {
    "id": "00000000-0000-0000-0000-000000000010",
    "subject": "Welcome",
    "content_html": "<p>Hello</p>",
    "planned_at": _DT,
    "mail_type": None,
    "mail_status": "not_sent",
    "status": "pending",
    "sent_at": None,
    "created_at": _DT,
    "updated_at": _DT,
    "created_by": None,
    "updated_by": None,
}


@scenario(FEATURE, "GET /mail/0010 as admin — mail is returned")
def test_get_admin():
    pass


@scenario(FEATURE, "GET /mail/0010 as a viewer — 403 error")
def test_get_forbidden():
    pass

@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.tools.mail.router.get_database", return_value=MagicMock()),
        patch("app.platform.tools.mail.router.get_document_by_id",
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
        patch("app.platform.tools.mail.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
