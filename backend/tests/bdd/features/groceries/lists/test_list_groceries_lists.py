import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.groceries.lists.router import lists_router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(lists_router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/groceries/lists/list_groceries_lists.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "GET /groceries-lists/by-instance/0100 as a project member — lists are returned ordered by date")
def test_list_groceries_lists_success():
    pass


@scenario(FEATURE, "GET /groceries-lists/by-instance/0100 without project access — 403 error")
def test_list_groceries_lists_forbidden():
    pass
