from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.functions.documents.router import router as documents_router
from tests.conftest import _ADMIN_USER, _REGULAR_USER

_test_app = FastAPI()
_test_app.include_router(documents_router, prefix="/api/platform/functions")

FEATURE = "../../../../features/platform/functions/documents/get_document.feature"

_FAKE_DOC = {
    "id": "00000000-0000-0000-0000-000000000010",
    "content_html": "<p>Content</p>",
    "attachments": [],
    "status": "active",
    "content_summary": None,
    "created_at": datetime(2024, 1, 1),
    "updated_at": datetime(2024, 1, 1),
    "created_by": None,
    "updated_by": None,
}


@scenario(FEATURE, "GET /documents/0010 as admin with existing record — returns the document")
def test_get_document_admin():
    pass


@scenario(FEATURE, "GET /documents/0010 as a viewer — 403 error")
def test_get_document_forbidden():
    pass


@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.functions.documents.router.get_database", return_value=MagicMock()),
        patch("app.platform.functions.documents.router.get_document_by_id",
              new=AsyncMock(return_value=_FAKE_DOC)),
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
        patch("app.platform.functions.documents.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
