from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.roles.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, FakeRolesStore, _make_fake_delete_document

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/platform/core/authorization")

FEATURE = "../../../../../features/platform/core/roles/archive_role.feature"


@scenario(FEATURE, "DELETE /roles/0010 as admin — role is archived")
def test_archive_admin():
    pass


@scenario(FEATURE, "DELETE /roles/0010 as a viewer — 403 error and the role is not archived")
def test_archive_forbidden():
    pass

@pytest.fixture
def admin_client(managed_roles_store: FakeRolesStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.core.authorization.roles.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.roles.router.check_cascade_constraint",
              new=AsyncMock(return_value=None)),
        patch("app.platform.core.authorization.roles.router.delete_document",
              new=AsyncMock(side_effect=_make_fake_delete_document(managed_roles_store))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()

@pytest.fixture
def non_admin_client(managed_roles_store: FakeRolesStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.platform.core.authorization.roles.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
