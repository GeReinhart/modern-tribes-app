import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.groceries.catalog.router import sections_router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(sections_router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/groceries/catalog/reorder_groceries_sections.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(
    FEATURE,
    "PUT /groceries-sections/reorder as a project member — the sections are returned and stored in the new order",
)
def test_reorder_sections_success():
    pass


@scenario(
    FEATURE,
    "PUT /groceries-sections/reorder as a project guest — 403 error and the order is not changed",
)
def test_reorder_sections_forbidden():
    pass
