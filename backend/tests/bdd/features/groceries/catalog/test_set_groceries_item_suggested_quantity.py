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

FEATURE = "../../../../features/features/groceries/catalog/set_groceries_item_suggested_quantity.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(
    FEATURE,
    "PUT /groceries-items/3001/suggested-quantity as a project member — the suggested quantity is set",
)
def test_set_suggested_quantity_success():
    pass


@scenario(
    FEATURE,
    "PUT /groceries-items/3001/suggested-quantity when a renewal is already tracked — both are kept",
)
def test_set_suggested_quantity_keeps_renewal():
    pass


@scenario(
    FEATURE,
    "PUT /groceries-items/3001/suggested-quantity with no value while no renewal is tracked either — "
    "tracking is removed",
)
def test_set_suggested_quantity_clear_removes_row():
    pass


@scenario(
    FEATURE,
    "PUT /groceries-items/3001/suggested-quantity with no value while a renewal is still tracked — "
    "only the quantity is cleared",
)
def test_set_suggested_quantity_clear_keeps_renewal():
    pass


@scenario(
    FEATURE,
    "PUT /groceries-items/3001/suggested-quantity as a project guest — 403 error and nothing is set",
)
def test_set_suggested_quantity_forbidden():
    pass


@scenario(FEATURE, "PUT /groceries-items/9999/suggested-quantity on a non-existent item — 404 error")
def test_set_suggested_quantity_not_found():
    pass
