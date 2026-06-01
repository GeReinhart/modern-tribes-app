from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.tasks.kanban.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/kanban/kanban_labels.feature"

@scenario(FEATURE, "GET /kanban/labels/0100 as admin — labels are returned")
def test_list_kanban_labels_admin():
    pass

@scenario(FEATURE, "POST /kanban/labels as admin — label is created")
def test_create_kanban_label_admin():
    pass

@scenario(FEATURE, "PATCH /kanban/labels/0010 as admin — label is updated")
def test_update_kanban_label_admin():
    pass

@scenario(FEATURE, "POST /kanban/labels as a viewer without project access — 403 error")
def test_create_kanban_label_forbidden():
    pass

@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.features.tasks.kanban.router.get_database", return_value=MagicMock()),
        patch("app.features.tasks.kanban.router._require_feature_access", new=AsyncMock(return_value="proj")),
        patch("app.platform.functions.labels.repository.fetch_labels_for_feature", new=AsyncMock(return_value=[])),
        patch("app.platform.functions.labels.repository.insert_feature_label",
              new=AsyncMock(return_value={"id": "lbl1", "name": "Bug", "color": "#ff0000", "position": 1})),
        patch("app.platform.functions.labels.repository.fetch_label_by_id",
              new=AsyncMock(return_value={"id": "lbl1", "name": "Bug", "color": "#ff0000", "position": 1, "feature_instance_id": "fi-id"})),
        patch("app.platform.functions.labels.repository.update_feature_label",
              new=AsyncMock(return_value={"id": "lbl1", "name": "Feature", "color": "#ff0000", "position": 1})),
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
        patch("app.features.tasks.kanban.router.get_database", return_value=MagicMock()),
        patch("app.features.tasks.kanban.router._require_feature_access",
              new=AsyncMock(side_effect=__import__("fastapi").HTTPException(403, "No access"))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
