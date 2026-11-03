import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.features.language.lesson.router import router
from app.platform.core.authentication.router import get_current_user
from tests.conftest import _PROFILE_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/language/lesson/suggest_translation_online.feature"


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


@scenario(
    FEATURE,
    "GET an online translation when the service is configured — one suggestion marked as online is returned, without article or plural",
)
def test_online_translation_configured():
    pass


@scenario(FEATURE, "GET an online translation when the service is not configured — 503 online_translation_unavailable")
def test_online_translation_not_configured():
    pass


@scenario(FEATURE, "GET an online translation when the service fails or times out — 502 online_translation_failed")
def test_online_translation_fails():
    pass


@scenario(FEATURE, "GET an online translation as a user with no role at all — 403")
def test_online_translation_forbidden():
    pass
