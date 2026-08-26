import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.meals.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/meals/list_meals_added_to_groceries_list.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(
    FEATURE,
    "GET /meals/added-to-groceries-list/8001 as a project member — added meals are listed with their date, headcount and recipes",
)
def test_list_added_meals_success():
    pass


@scenario(FEATURE, "GET /meals/added-to-groceries-list/8001 — no meals added yet, an empty list is returned")
def test_list_added_meals_empty():
    pass


@scenario(FEATURE, "GET /meals/added-to-groceries-list/8001 without project access — 403 error")
def test_list_added_meals_forbidden():
    pass
