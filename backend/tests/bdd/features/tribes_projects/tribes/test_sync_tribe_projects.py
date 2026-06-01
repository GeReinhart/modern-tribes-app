from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.tribes_projects.tribes.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, FakeTribesStore, _make_fake_check_document_exists

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/features/tribes-projects")

FEATURE = "../../../../features/features/tribes_projects/tribes/sync_tribe_projects.feature"

from datetime import datetime
_DT = datetime(2024, 1, 1)
_FAKE_TRIBE = {"id": "00000000-0000-0000-0000-000000000010", "name": "Engineering", "url_param_id": "abc123", "document_id": None, "status": "active", "created_at": _DT, "updated_at": _DT, "created_by": None, "updated_by": None}


@scenario(FEATURE, "PUT /tribes/0010/projects as admin — projects are synced")
def test_sync_tribe_projects_admin():
    pass


@scenario(FEATURE, "PUT /tribes/0010/projects as a viewer — 403 error")
def test_sync_tribe_projects_forbidden():
    pass


@pytest.fixture
def admin_client(tribes_store: FakeTribesStore):
    tribes_store.insert(_FAKE_TRIBE)
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.features.tribes_projects.tribes.router.get_database", return_value=MagicMock()),
        patch("app.features.tribes_projects.tribes.router.check_document_exists",
              new=AsyncMock(side_effect=_make_fake_check_document_exists(tribes_store))),
        patch("app.platform.core.utils.validators.EntityValidator.validate_reference_lists",
              new=AsyncMock(return_value=None)),
        patch("app.features.tribes_projects.tribes.repository.sync_tribe_projects",
              new=AsyncMock(return_value=[])),
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
        patch("app.features.tribes_projects.tribes.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
