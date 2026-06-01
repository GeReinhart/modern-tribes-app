from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.tools.mail.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, FakeMailsStore, _make_fake_create_document

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/platform/tools")

FEATURE = "../../../../features/platform/tools/mail/create_mail.feature"


@scenario(FEATURE, "POST /mail/ with valid body as admin — the mail is created")
def test_create_admin():
    pass


@scenario(FEATURE, "POST /mail/ with missing subject — 422 error and the database is not modified")
def test_create_missing_field():
    pass


@scenario(FEATURE, "POST /mail/ as a viewer — 403 error and the database is not modified")
def test_create_forbidden():
    pass

@pytest.fixture
def admin_client(mails_store: FakeMailsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.tools.mail.router.get_database", return_value=MagicMock()),
        patch("app.platform.tools.mail.router.create_document",
              new=AsyncMock(side_effect=_make_fake_create_document(mails_store, "mails"))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()

@pytest.fixture
def non_admin_client(mails_store: FakeMailsStore):
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
