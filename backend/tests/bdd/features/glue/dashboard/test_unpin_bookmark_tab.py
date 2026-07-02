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

FEATURE = "../../../../features/features/glue/dashboard/unpin_bookmark_tab.feature"


@scenario(FEATURE, "DELETE /dashboard/pinned-tabs/{id} as the owner — the tab is removed")
def test_unpin_tab_owner():
    pass


@scenario(FEATURE, "DELETE /dashboard/pinned-tabs/{id} on a tab belonging to another user — 403 error")
def test_unpin_tab_other_user():
    pass


@scenario(FEATURE, "DELETE /dashboard/pinned-tabs/{id} with a non-existent id — 404 error")
def test_unpin_tab_not_found():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
