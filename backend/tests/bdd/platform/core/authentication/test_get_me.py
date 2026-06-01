from datetime import datetime
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authentication.router import router as auth_router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(auth_router, prefix="/api/platform/core")

FEATURE = "../../../../features/platform/core/authentication/get_me.feature"

_ADMIN_USER_FULL = {**_ADMIN_USER, "created_at": datetime(2024, 1, 1), "language": "en"}
_REGULAR_USER_FULL = {**_REGULAR_USER, "created_at": datetime(2024, 1, 1), "language": "en"}


@scenario(FEATURE, "GET /authentication/me as admin — profile is returned")
def test_get_me_admin():
    pass


@scenario(FEATURE, "GET /authentication/me as a regular user — profile is returned")
def test_get_me_regular():
    pass


@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER_FULL
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER_FULL
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
