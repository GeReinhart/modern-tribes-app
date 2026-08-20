import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.groceries.lists.router import lists_router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(lists_router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/groceries/lists/get_suggested_items.feature"


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


@scenario(FEATURE, "GET /groceries-lists/by-instance/0100/suggestions as a project member — items due for restock are returned")
def test_get_suggestions_as_member():
    pass


@scenario(FEATURE, "GET /groceries-lists/by-instance/0100/suggestions as an administrator — items due for restock are returned")
def test_get_suggestions_as_admin():
    pass


@scenario(FEATURE, "GET /groceries-lists/by-instance/0100/suggestions without project access — 403 error")
def test_get_suggestions_forbidden():
    pass
