from datetime import datetime
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.features.tasks.todo_list.router import router, label_router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(label_router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/tasks/todo_list/todo_labels.feature"

@scenario(FEATURE, "GET /todo-labels/by-instance/0100 as admin — labels are returned")
def test_list_todo_labels_admin():
    pass

@scenario(FEATURE, "POST /todo-labels/ as admin — label is created")
def test_create_todo_label_admin():
    pass

@scenario(FEATURE, "PATCH /todo-labels/0010 as admin — label is updated")
def test_update_todo_label_admin():
    pass

@scenario(FEATURE, "POST /todo-labels/ as a viewer without project access — 403 error")
def test_create_todo_label_forbidden():
    pass

@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()

@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
