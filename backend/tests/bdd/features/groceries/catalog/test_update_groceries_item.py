import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.groceries.catalog.router import items_router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(items_router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/groceries/catalog/update_groceries_item.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "PATCH /groceries-items/3001 as a project member — the icon is set")
def test_update_item_icon_success():
    pass


@scenario(FEATURE, "PATCH /groceries-items/3001 with a new name and unit — they are updated")
def test_update_item_name_and_unit():
    pass


@scenario(FEATURE, "PATCH /groceries-items/3001 with status archived — the item is archived")
def test_update_item_archive():
    pass


@scenario(FEATURE, "PATCH /groceries-items/3001 as a project guest — 403 error and the icon is not set")
def test_update_item_icon_forbidden():
    pass


@scenario(FEATURE, "PATCH /groceries-items/9999 on a non-existent item — 404 error")
def test_update_item_icon_not_found():
    pass
