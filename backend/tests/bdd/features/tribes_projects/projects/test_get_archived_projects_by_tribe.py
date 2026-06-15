import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.features.tribes_projects.projects.query_router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tribes-projects")

FEATURE = "../../../../features/features/tribes_projects/projects/get_archived_projects_by_tribe.feature"


@scenario(FEATURE, "GET /projects/by/tribe/0010/archived as manager — archived projects returned")
def test_get_archived_as_manager():
    pass


@scenario(FEATURE, "GET /projects/by/tribe/0010/archived as a member — 403 error")
def test_get_archived_as_member_forbidden():
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
