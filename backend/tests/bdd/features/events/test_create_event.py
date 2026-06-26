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
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")
_test_app.include_router(label_router, prefix="/api/features/tasks")
_test_app.include_router(glue_router, prefix="/api/features/glue")
_test_app.include_router(projects_router, prefix="/api/features/tribes-projects")
_test_app.include_router(tribes_router, prefix="/api/features/tribes-projects")
_test_app.include_router(positions_router, prefix="/api/features/tribes-projects")

FEATURE = "../../../features/features/events/create_event.feature"


@scenario(FEATURE, "POST /events with valid body as admin — the event is created")
def test_create_event_admin():
    pass


@scenario(FEATURE, "POST /events with all_day true — end time stored as given")
def test_create_event_all_day():
    pass


@scenario(FEATURE, "POST /events as user with no app access — 403 error")
def test_create_event_forbidden():
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
