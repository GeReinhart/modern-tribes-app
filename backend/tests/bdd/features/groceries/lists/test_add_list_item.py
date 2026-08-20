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

FEATURE = "../../../../features/features/groceries/lists/add_list_item.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "POST /groceries-lists/0201/items as a project member — the item is added to the list")
def test_add_list_item_success():
    pass


@scenario(FEATURE, "POST /groceries-lists/0201/items as a project guest — 403 error and the list is not modified")
def test_add_list_item_guest_forbidden():
    pass


@scenario(FEATURE, "POST /groceries-lists/0201/items with an unknown catalog item — 404 error and the list is not modified")
def test_add_list_item_unknown_item():
    pass


@scenario(FEATURE, "POST /groceries-lists/0201/items with a missing quantity — 422 error and the list is not modified")
def test_add_list_item_missing_quantity():
    pass
