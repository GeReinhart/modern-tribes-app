import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.features.tasks.my_tasks.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, _PROFILE_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features")

FEATURE = "../../../../features/features/tasks/my_tasks/get_my_tasks.feature"


@scenario(FEATURE, "GET /my-tasks — included: task assigned to me with a due date")
def test_included_assigned_with_due_date():
    pass


@scenario(FEATURE, "GET /my-tasks — included: unassigned task with a due date")
def test_included_unassigned_with_due_date():
    pass


@scenario(FEATURE, "GET /my-tasks — included: task assigned to me, no due date, created more than 100 days ago")
def test_included_assigned_old():
    pass


@scenario(FEATURE, "GET /my-tasks — included: unassigned task, no due date, created more than 100 days ago")
def test_included_unassigned_old():
    pass


@scenario(FEATURE, "GET /my-tasks — excluded: task assigned to another person")
def test_excluded_other_person():
    pass


@scenario(FEATURE, "GET /my-tasks — excluded: task assigned to me, no due date, created less than 100 days ago")
def test_excluded_assigned_recent():
    pass


@scenario(FEATURE, "GET /my-tasks as a user with no app access — 403 error")
def test_get_my_tasks_forbidden():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def profile_owner_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _PROFILE_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
