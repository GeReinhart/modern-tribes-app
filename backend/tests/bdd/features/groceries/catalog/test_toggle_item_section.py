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

FEATURE = "../../../../features/features/groceries/catalog/toggle_item_section.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "POST /groceries-items/3001/sections/4001 as a project member — the section is linked")
def test_toggle_item_section_success():
    pass


@scenario(FEATURE, "POST /groceries-items/3001/sections/4001 as a project guest — 403 error and the link is not created")
def test_toggle_item_section_forbidden():
    pass
