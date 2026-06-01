from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.functions.documents.router import router as documents_router
from tests.conftest import (
    _ADMIN_USER,
    _REGULAR_USER,
    FakeDocumentsStore,
    _make_fake_delete_document,
)

_test_app = FastAPI()
_test_app.include_router(documents_router, prefix="/api/platform/functions")

FEATURE = "../../../../features/platform/functions/documents/archive_document.feature"


@scenario(FEATURE, "DELETE /documents/0010 as admin — document is archived")
def test_archive_document_admin():
    pass


@scenario(FEATURE, "DELETE /documents/0010 as a viewer — 403 error and the document is not archived")
def test_archive_document_forbidden():
    pass


@pytest.fixture
def admin_client(documents_store: FakeDocumentsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.functions.documents.router.get_database", return_value=MagicMock()),
        patch("app.platform.functions.documents.router.delete_document",
              new=AsyncMock(side_effect=_make_fake_delete_document(documents_store))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client(documents_store: FakeDocumentsStore):
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
