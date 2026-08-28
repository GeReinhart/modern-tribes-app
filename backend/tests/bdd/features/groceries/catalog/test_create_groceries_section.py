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

FEATURE = "../../../../features/features/groceries/catalog/create_groceries_section.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(
    FEATURE,
    "POST /groceries-sections/ as a project member — the section is created in the shared catalog, "
    "alimentaire by default",
)
def test_create_groceries_section_success():
    pass


@scenario(FEATURE, "POST /groceries-sections/ with is_food false — the section is created as non-food")
def test_create_groceries_section_non_food():
    pass


@scenario(FEATURE, "POST /groceries-sections/ as a project guest — 403 error and the catalog is not modified")
def test_create_groceries_section_guest_forbidden():
    pass


@scenario(FEATURE, "POST /groceries-sections/ with a missing name — 422 error and the catalog is not modified")
def test_create_groceries_section_missing_name():
    pass
