import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.platform.core.authentication.router import get_current_user
from app.platform.functions.people.represents.router import router as represents_router
from pytest_bdd import scenario
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(represents_router, prefix="/api/platform/functions/people")

FEATURE = "../../../../features/platform/people/represents/create_represents.feature"

@scenario(FEATURE, "POST /represents/ with valid body as admin — the link is created")
def test_create_represents_success():
    pass

@scenario(FEATURE, "POST /represents/ with a missing required field — 422 error and the database is not modified")
def test_create_represents_missing_field():
    pass

@scenario(FEATURE, "POST /represents/ as a viewer — 403 error and the database is not modified")
def test_create_represents_forbidden():
    pass

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
