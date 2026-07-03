import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.features.glue.quick_add_defaults.router import router
from tests.conftest import _REGULAR_USER, _PROFILE_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/glue")

FEATURE = "../../../../features/features/glue/quick_add_defaults/quick_add_defaults.feature"


@scenario(FEATURE, "GET quick-add defaults — nothing configured yet")
def test_get_defaults_empty():
    pass


@scenario(FEATURE, "PUT quick-add default — configure an explicit default for task")
def test_put_default_configure_task():
    pass


@scenario(FEATURE, "PUT quick-add default — configure an explicit default for event")
def test_put_default_configure_event():
    pass


@scenario(FEATURE, "PUT quick-add default — clear a previously configured default")
def test_put_default_clear():
    pass


@scenario(FEATURE, "GET quick-add defaults — returns the previously configured value")
def test_get_defaults_configured():
    pass


@scenario(FEATURE, "PUT quick-add default — feature instance of the wrong type is rejected")
def test_put_default_wrong_type():
    pass


@scenario(FEATURE, "GET quick-add defaults as profile-only user — 403 error")
def test_get_defaults_forbidden():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def profile_owner_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _PROFILE_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
