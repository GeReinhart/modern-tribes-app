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

FEATURE = "../../../../features/features/glue/dashboard/pin_bookmark_tab.feature"


@scenario(FEATURE, "POST /dashboard/pinned-tabs as viewer with a valid bookmark — the tab is pinned")
def test_pin_bookmark_valid():
    pass


@scenario(FEATURE, "POST /dashboard/pinned-tabs with a second bookmark — display_order is incremented")
def test_pin_bookmark_second():
    pass


@scenario(FEATURE, "POST /dashboard/pinned-tabs with a bookmark that belongs to another user — 403 error")
def test_pin_bookmark_other_user():
    pass


@scenario(FEATURE, "POST /dashboard/pinned-tabs with a bookmark already pinned — 409 conflict")
def test_pin_bookmark_duplicate():
    pass


@scenario(FEATURE, "POST /dashboard/pinned-tabs as profile-only user — 403 error")
def test_pin_bookmark_forbidden():
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
