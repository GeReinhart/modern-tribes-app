import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.events.router import router, label_router
from app.features.glue.features.router import router as glue_router
from app.features.tribes_projects.projects.router import router as projects_router
from app.features.tribes_projects.tribes.router import router as tribes_router
from app.features.tribes_projects.positions.router import router as positions_router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, _PROFILE_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")
_test_app.include_router(label_router, prefix="/api/features/tasks")
_test_app.include_router(glue_router, prefix="/api/features/glue")
_test_app.include_router(projects_router, prefix="/api/features/tribes-projects")
_test_app.include_router(tribes_router, prefix="/api/features/tribes-projects")
_test_app.include_router(positions_router, prefix="/api/features/tribes-projects")

FEATURE = "../../../features/features/events/list_accessible_events.feature"


@scenario(FEATURE, "GET /events/accessible as a project member — returns events from accessible projects")
def test_list_accessible_events_member():
    pass


@scenario(FEATURE, "GET /events/accessible as admin — returns all events")
def test_list_accessible_events_admin():
    pass


@scenario(FEATURE, "GET /events/accessible as outsider with no project access — returns empty list")
def test_list_accessible_events_outsider():
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


@pytest.fixture
def profile_owner_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _PROFILE_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
