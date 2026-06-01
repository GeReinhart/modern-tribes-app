import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.platform.core.authentication.router import get_current_user
from app.platform.functions.people.users.router import router as users_router
from pytest_bdd import scenario
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(users_router, prefix="/api/platform/functions/people")

FEATURE = "../../../../features/platform/people/users/update_user.feature"

@scenario(FEATURE, "PUT /users/0010 with valid fields as admin — user is updated")
def test_update_user_admin():
    pass

@scenario(FEATURE, "PUT /users/0010 as a viewer — 403 error and the user is not modified")
def test_update_user_forbidden():
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
