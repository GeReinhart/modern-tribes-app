import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.features.glue.tab_config.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, _PROFILE_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/glue")

FEATURE = "../../../features/features/tab_config/update_tab_config.feature"

@scenario(FEATURE, "PUT /tab-configs/my-context as viewer — tab config is updated")
def test_update_tab_config_viewer():
    pass

@scenario(FEATURE, "PUT /tab-configs/my-context as a user with no app access — 403 error")
def test_update_tab_config_forbidden():
    pass

@scenario(FEATURE, "PUT /tab-configs/my-context as viewer — a personal icon override round-trips")
def test_update_tab_config_icon_override():
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
