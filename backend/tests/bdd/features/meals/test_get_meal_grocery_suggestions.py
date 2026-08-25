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

FEATURE = "../../../features/features/meals/get_meal_grocery_suggestions.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(
    FEATURE,
    "GET /meals/grocery-suggestions/8001 — ingredients of a meal planned after the list are "
    "suggested, scaled to its headcount",
)
def test_grocery_suggestions_scaled():
    pass


@scenario(FEATURE, "GET /meals/grocery-suggestions/8001 — quantities for non-divisible items are rounded up")
def test_grocery_suggestions_rounded_up():
    pass


@scenario(FEATURE, "GET /meals/grocery-suggestions for a list already marked done — no suggestions are returned")
def test_grocery_suggestions_done_list():
    pass


@scenario(FEATURE, "GET /meals/grocery-suggestions/8001 without project access — 403 error")
def test_grocery_suggestions_forbidden():
    pass
