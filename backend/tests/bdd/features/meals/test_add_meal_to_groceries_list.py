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

FEATURE = "../../../features/features/meals/add_meal_to_groceries_list.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(
    FEATURE,
    "POST /meals/grocery-suggestions/8001/add/7001 as a project member — all ingredients are added and the meal is marked added",
)
def test_add_meal_success():
    pass


@scenario(
    FEATURE,
    "POST /meals/grocery-suggestions/8001/add/7001 — an ingredient already on the list has its quantity "
    "increased instead of being duplicated, and the comment reflects this meal's contribution",
)
def test_add_meal_merges_existing_item():
    pass


@scenario(
    FEATURE,
    "POST /meals/grocery-suggestions/8001/add/7001 when the meal was already added — 400 error and nothing changes",
)
def test_add_meal_already_added():
    pass


@scenario(
    FEATURE,
    "POST /meals/grocery-suggestions/8001/add/7001 as a project guest — 403 error and nothing changes",
)
def test_add_meal_forbidden():
    pass


@scenario(FEATURE, "GET /meals/grocery-suggestions/8001 — an already-added meal is still listed, flagged as added")
def test_get_suggestions_shows_added():
    pass


@scenario(
    FEATURE,
    "POST /meals/grocery-suggestions/8001/add/7001 — accompaniments are not swept in by the bulk add",
)
def test_add_meal_excludes_accompaniments():
    pass


@scenario(
    FEATURE,
    "POST /meals/grocery-suggestions/8001/add-ingredient/7001/9004 — an accompaniment is added on its own, "
    "scaled to headcount",
)
def test_add_single_accompaniment():
    pass


@scenario(
    FEATURE,
    "POST /meals/grocery-suggestions/8001/add-ingredient/7001/9004 as a project guest — 403 error and nothing "
    "changes",
)
def test_add_single_accompaniment_forbidden():
    pass


@scenario(
    FEATURE,
    "POST /meals/grocery-suggestions/8001/add/7001 — the meal's description is included in each added item's comment",
)
def test_add_meal_comment_includes_description():
    pass


@scenario(
    FEATURE,
    "DELETE /meals/grocery-suggestions/8001/add/7001 — an added meal is un-marked, its list items untouched",
)
def test_remove_meal_success():
    pass


@scenario(
    FEATURE,
    "POST /meals/grocery-suggestions/8001/add/7001 after a prior removal — the meal can be added again",
)
def test_add_meal_after_removal():
    pass


@scenario(FEATURE, "DELETE /meals/grocery-suggestions/8001/add/7001 when the meal isn't added — 400 error")
def test_remove_meal_not_added():
    pass


@scenario(FEATURE, "DELETE /meals/grocery-suggestions/8001/add/7001 as a project guest — 403 error and nothing changes")
def test_remove_meal_forbidden():
    pass
