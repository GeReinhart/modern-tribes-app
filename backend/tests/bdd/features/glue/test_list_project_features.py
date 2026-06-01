from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.glue.features.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, _PROFILE_USER, _make_mock_pool

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/features/glue")

FEATURE = "../../../features/features/glue/list_project_features.feature"

_FAKE_ROW = {
    "id": UUID("00000000-0000-0000-0000-000000000010"),
    "project_id": UUID("00000000-0000-0000-0000-000000000100"),
    "feature_type": "kanban",
    "name": "Board",
    "status": "active",
    "position": 0,
    "created_at": datetime(2024, 1, 1),
    "updated_at": datetime(2024, 1, 1),
    "created_by": None,
    "updated_by": None,
}

@scenario(FEATURE, "GET /feature-instances/projects/0100/features as admin — feature instances are returned")
def test_list_project_features_admin():
    pass

@scenario(FEATURE, "GET /feature-instances/projects/0100/features as a viewer without project access — 403 error")
def test_list_project_features_forbidden():
    pass

@pytest.fixture
def admin_client():
    pool = _make_mock_pool(_FAKE_ROW)
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.features.glue.features.router.get_database", return_value=pool),
        patch("app.features.glue.features.router.resolve_url_param_id", new=AsyncMock(side_effect=lambda p,t,v: v)),
        patch("app.features.glue.features.router.check_project_access_or_admin", new=AsyncMock(return_value="manager")),
        patch("app.features.registry.get_available_feature_types", return_value=[]),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client():
    pool = _make_mock_pool(_FAKE_ROW)
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.features.glue.features.router.get_database", return_value=pool),
        patch("app.features.glue.features.router.resolve_url_param_id", new=AsyncMock(side_effect=lambda p,t,v: v)),
        patch("app.features.glue.features.router.check_project_access_or_admin",
              new=AsyncMock(side_effect=__import__("fastapi").HTTPException(status_code=403, detail="No access"))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def profile_owner_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _PROFILE_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_manage_own_profile"])),
        patch("app.features.glue.features.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
