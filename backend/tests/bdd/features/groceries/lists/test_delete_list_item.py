import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.groceries.lists.router import list_items_router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(list_items_router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/groceries/lists/delete_list_item.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "DELETE /groceries-list-items/4001 as a project member — the item is removed")
def test_delete_list_item_success():
    pass


@scenario(FEATURE, "DELETE /groceries-list-items/4001 as a project guest — 403 error and the item is not removed")
def test_delete_list_item_forbidden():
    pass


@scenario(FEATURE, "DELETE /groceries-list-items/9999 on a non-existent item — 404 error")
def test_delete_list_item_not_found():
    pass
