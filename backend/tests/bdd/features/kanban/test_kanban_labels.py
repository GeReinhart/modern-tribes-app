import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.features.tasks.kanban.router import router
from app.features.tasks.kanban.card_router import card_router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")
_test_app.include_router(card_router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/tasks/kanban/kanban_labels.feature"

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
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()

@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
