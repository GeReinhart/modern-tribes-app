import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.recipes.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/recipes/create_recipe.feature"


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


@scenario(FEATURE, "POST /recipes with valid body as admin — the recipe is created")
def test_create_recipe_admin():
    pass


@scenario(FEATURE, "POST /recipes with a description — the note is saved and linked")
def test_create_recipe_with_description():
    pass


@scenario(FEATURE, "POST /recipes with a missing servings count — 422 error and the database is not modified")
def test_create_recipe_missing_servings():
    pass


@scenario(FEATURE, "POST /recipes as a user with no app access — 403 error and the database is not modified")
def test_create_recipe_forbidden():
    pass
