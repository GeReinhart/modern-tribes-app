import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.features.tribes_projects.projects.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tribes-projects")

FEATURE = "../../../../features/features/tribes_projects/projects/unarchive_project.feature"


@scenario(FEATURE, "PATCH /projects/0010/unarchive as admin — project is reactivated")
def test_unarchive_admin():
    pass


@scenario(FEATURE, "PATCH /projects/0010/unarchive as project manager — project is reactivated")
def test_unarchive_manager():
    pass


@scenario(FEATURE, "PATCH /projects/0010/unarchive as a viewer without project access — 403 error")
def test_unarchive_forbidden():
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
