import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.features.tasks.todo_list.router import router, label_router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")
_test_app.include_router(label_router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/tasks/todo_list/search_indexing_todo.feature"


@scenario(FEATURE, "POST /todo-items/ as admin — the item is indexed in search")
def test_create_todo_indexed():
    pass


@scenario(FEATURE, "PATCH /todo-items/{id} title update — search index is refreshed")
def test_update_todo_reindexed():
    pass


@scenario(FEATURE, "POST /todo-items/{id}/labels/{label_id} — label name is added to search index")
def test_toggle_todo_label_reindexed():
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
