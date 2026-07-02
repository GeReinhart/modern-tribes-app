import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.features.glue.dashboard.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, _PROFILE_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/glue")

FEATURE = "../../../../features/features/glue/dashboard/list_pinned_tabs.feature"


@scenario(FEATURE, "GET /dashboard/pinned-tabs as viewer with two pinned tabs — returns only the user's tabs in order")
def test_list_pinned_tabs_viewer():
    pass


@scenario(FEATURE, "GET /dashboard/pinned-tabs as viewer with no pinned tabs — returns empty list")
def test_list_pinned_tabs_empty():
    pass


@scenario(FEATURE, "GET /dashboard/pinned-tabs as profile-only user — 403 error")
def test_list_pinned_tabs_forbidden():
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
