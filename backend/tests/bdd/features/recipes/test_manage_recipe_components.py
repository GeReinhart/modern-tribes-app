import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.recipes.router import router, components_router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")
_test_app.include_router(components_router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/recipes/manage_recipe_components.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "POST /recipes/6001/components with a valid body — the component link appears")
def test_add_component_success():
    pass


@scenario(
    FEATURE,
    "POST /recipes/6001/components with the recipe itself as the component — 422 error, no link created",
)
def test_add_component_self_reference():
    pass


@scenario(
    FEATURE,
    "POST /recipes/6001/components with an unknown component recipe — 404 error, no link created",
)
def test_add_component_unknown_recipe():
    pass


@scenario(
    FEATURE,
    "POST /recipes/6001/components with a component that already has its own component — 422 error, no link created",
)
def test_add_component_no_nested_composition():
    pass


@scenario(FEATURE, "POST /recipes/6001/components as a project guest — 403 error, no link created")
def test_add_component_forbidden():
    pass


@scenario(
    FEATURE,
    "GET /recipes/6001 with a component — the component's ingredients are scaled by its multiplier "
    "and its own description is included",
)
def test_get_recipe_with_component():
    pass


@scenario(FEATURE, "DELETE /recipe-components/8001 — the component link is removed")
def test_delete_component_success():
    pass


@scenario(FEATURE, "DELETE /recipe-components/8001 as a project guest — 403 error, the link is not removed")
def test_delete_component_forbidden():
    pass
