import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.recipes.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/recipes/update_recipe.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "PATCH /recipes/6001 with a new name and servings — the recipe is updated")
def test_update_recipe_name_servings():
    pass


@scenario(FEATURE, "PATCH /recipes/6001 setting recipe_state to completed — the recipe is marked completed")
def test_update_recipe_state_completed():
    pass


@scenario(FEATURE, "PATCH /recipes/6001 setting recipe_state back to draft — the recipe is marked as a draft again")
def test_update_recipe_state_draft():
    pass


@scenario(FEATURE, "PATCH /recipes/6001 as a project guest — 403 error and the recipe is not modified")
def test_update_recipe_forbidden():
    pass
