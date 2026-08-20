import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.groceries.catalog.router import items_router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(items_router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/groceries/catalog/create_groceries_item.feature"


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


@scenario(FEATURE, "POST /groceries-items/ as a project member — the item is created in the shared catalog")
def test_create_groceries_item_success():
    pass


@scenario(FEATURE, "POST /groceries-items/ marked as not divisible — it is stored as such")
def test_create_groceries_item_not_divisible():
    pass


@scenario(FEATURE, "POST /groceries-items/ without a description — it defaults to empty")
def test_create_groceries_item_no_description():
    pass


@scenario(FEATURE, "POST /groceries-items/ as a project guest — 403 error and the catalog is not modified")
def test_create_groceries_item_guest_forbidden():
    pass


@scenario(FEATURE, "POST /groceries-items/ without project access — 403 error and the catalog is not modified")
def test_create_groceries_item_no_access_forbidden():
    pass


@scenario(FEATURE, "POST /groceries-items/ with an invalid unit — 422 error and the catalog is not modified")
def test_create_groceries_item_invalid_unit():
    pass


@scenario(FEATURE, "POST /groceries-items/ with a missing name — 422 error and the catalog is not modified")
def test_create_groceries_item_missing_name():
    pass
