from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.tasks.todo_list.router import router, label_router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, _make_mock_pool

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/todo_list/create_todo.feature"

@scenario(FEATURE, "POST /todo-items/ as admin — the item is created")
def test_create_todo_admin():
    pass

@scenario(FEATURE, "POST /todo-items/ as a viewer without project access — 403 error")
def test_create_todo_forbidden():
    pass

@pytest.fixture
def admin_client():
    pool = _make_mock_pool({'project_id': '00000000-0000-0000-0000-000000000200'})
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.features.tasks.todo_list.router.get_database", return_value=pool),
        patch("app.features.tasks.todo_list.router.check_project_access_or_admin", new=AsyncMock(return_value="member")),
        patch("app.features.tasks.todo_list.repository.insert_todo_item",
              new=AsyncMock(return_value={'id': '00000000-0000-0000-0000-000000000001', 'feature_instance_id': '00000000-0000-0000-0000-000000000100', 'title': 'Test todo', 'status': 'active', 'todo_status': 'pending', 'document_id': None, 'document_content_html': None, 'position': 1, 'size': None, 'due_date': None, 'assigned_person_id': None, 'assigned_person_name': None, 'label_ids': [], 'created_at': datetime(2024,1,1), 'updated_at': datetime(2024,1,1), 'created_by': None, 'updated_by': None})),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client():
    pool = _make_mock_pool({"project_id": "00000000-0000-0000-0000-000000000200"})
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.features.tasks.todo_list.router.get_database", return_value=pool),
        patch("app.features.tasks.todo_list.router.check_project_access_or_admin",
              new=AsyncMock(side_effect=__import__("fastapi").HTTPException(403, "No access"))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
