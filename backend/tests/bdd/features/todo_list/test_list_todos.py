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

FEATURE = "../../../features/features/todo_list/list_todos.feature"

@scenario(FEATURE, "GET /todo-items/by-instance/0100 as admin — todo items are returned")
def test_list_todos_admin():
    pass

@scenario(FEATURE, "GET /todo-items/by-instance/0100 as a viewer without project access — 403 error")
def test_list_todos_forbidden():
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
        patch("app.features.tasks.todo_list.repository.fetch_todo_items", new=AsyncMock(return_value=[])),
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
