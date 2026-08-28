import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.tasks.todo_list.router import label_router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(label_router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/tasks/todo_list/reorder_todo_labels.feature"


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


@scenario(FEATURE, "PUT /todo-labels/reorder as a manager — the labels are returned and stored in the new order")
def test_reorder_labels_success():
    pass


@scenario(FEATURE, "PUT /todo-labels/reorder as a member (not a manager) — 403 error and the order is not changed")
def test_reorder_labels_forbidden():
    pass


@scenario(FEATURE, "PATCH /todo-labels/2001 with status archived — the label is archived and no longer listed")
def test_archive_label_via_update():
    pass
