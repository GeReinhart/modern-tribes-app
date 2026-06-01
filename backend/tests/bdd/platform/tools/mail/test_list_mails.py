from unittest.mock import AsyncMock, MagicMock, patch
from contextlib import asynccontextmanager

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.tools.mail.query_router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/platform/tools")

FEATURE = "../../../../features/platform/tools/mail/list_mails.feature"


@scenario(FEATURE, "GET /mail/ as admin — mails are returned")
def test_list_admin():
    pass


@scenario(FEATURE, "GET /mail/ as a viewer — 403 error")
def test_list_forbidden():
    pass


def _make_fake_pool():
    mock_conn = AsyncMock()
    mock_conn.fetch = AsyncMock(return_value=[])

    @asynccontextmanager
    async def fake_acquire():
        yield mock_conn

    mock_pool = MagicMock()
    mock_pool.acquire = fake_acquire
    return mock_pool


@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.tools.mail.query_router.get_database", return_value=_make_fake_pool()),
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
        patch("app.platform.tools.mail.query_router.get_database", return_value=_make_fake_pool()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
