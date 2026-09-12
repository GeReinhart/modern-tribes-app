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

FEATURE = "../../../features/features/recipes/get_recipe_document_revisions.feature"


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


@scenario(FEATURE, "GET revisions for a recipe whose description was never saved — empty history")
def test_get_recipe_document_revisions_empty():
    pass


@scenario(
    FEATURE,
    "GET revisions for a recipe whose description was updated — the previous version is kept, current first",
)
def test_get_recipe_document_revisions_after_update():
    pass


@scenario(FEATURE, "GET revisions for a recipe without project access — 403 error")
def test_get_recipe_document_revisions_forbidden():
    pass


@scenario(FEATURE, "GET revisions for an unknown recipe — 404 error")
def test_get_recipe_document_revisions_not_found():
    pass
