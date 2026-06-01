from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.core.app_config.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, FakeAppConfigStore, _make_fake_delete_document

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/platform/core")

FEATURE = "../../../../features/platform/core/app_config/archive_app_config.feature"


@scenario(FEATURE, "DELETE /app-config/0010 as admin — entry is archived")
def test_archive_admin():
    pass


@scenario(FEATURE, "DELETE /app-config/0010 as a viewer — 403 error and the entry is not archived")
def test_archive_forbidden():
    pass

@pytest.fixture
def admin_client(app_config_store: FakeAppConfigStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.core.app_config.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.app_config.router.delete_document",
              new=AsyncMock(side_effect=_make_fake_delete_document(app_config_store))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()

@pytest.fixture
def non_admin_client(app_config_store: FakeAppConfigStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.platform.core.app_config.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
