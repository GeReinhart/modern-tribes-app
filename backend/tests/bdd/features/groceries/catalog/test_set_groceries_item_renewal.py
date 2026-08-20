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

FEATURE = "../../../../features/features/groceries/catalog/set_groceries_item_renewal.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "PUT /groceries-items/3001/renewal as a project member — the renewal is set")
def test_set_renewal_success():
    pass


@scenario(FEATURE, "PUT /groceries-items/3001/renewal again — the renewal is updated, not duplicated")
def test_set_renewal_upsert():
    pass


@scenario(FEATURE, "PUT /groceries-items/3001/renewal with no value — tracking is removed")
def test_set_renewal_clear():
    pass


@scenario(FEATURE, "PUT /groceries-items/3001/renewal as a project guest — 403 error and nothing is set")
def test_set_renewal_forbidden():
    pass


@scenario(FEATURE, "PUT /groceries-items/9999/renewal on a non-existent item — 404 error")
def test_set_renewal_not_found():
    pass
