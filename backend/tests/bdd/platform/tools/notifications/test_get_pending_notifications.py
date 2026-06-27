import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.platform.tools.notifications.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/platform/tools")

FEATURE = "../../../../features/platform/tools/notifications/get_pending_notifications.feature"

@scenario(FEATURE, "GET /notifications/pending as admin — pending notifications are returned")
def test_get_pending_admin():
    pass

@scenario(FEATURE, "GET /notifications/pending as a regular user — pending notifications are returned")
def test_get_pending_regular():
    pass

@scenario(FEATURE, "Future-scheduled notification is excluded from pending list")
def test_future_scheduled_excluded():
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
