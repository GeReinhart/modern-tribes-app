import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.features.daily_journal.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, _PROFILE_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features")

FEATURE = "../../../features/features/daily_journal/dashboard_journal_summary.feature"


@scenario(FEATURE, "GET /journal-blocks/accessible?date=2026-07-01 as admin — returns journal tabs with block count and tribe for the day")
def test_dashboard_summary_admin():
    pass


@scenario(FEATURE, "GET /journal-blocks/accessible?date=2026-07-02 — returns empty list when no blocks exist for the date")
def test_dashboard_summary_empty():
    pass


@scenario(FEATURE, "GET /journal-blocks/accessible — archived blocks are not counted")
def test_dashboard_summary_archived():
    pass


@scenario(FEATURE, "GET /journal-blocks/accessible — resolves the tribe where the user is a manager when the project is shared across multiple tribes")
def test_dashboard_summary_manager_tribe():
    pass


@scenario(FEATURE, "GET /journal-blocks/accessible as a user without dashboard access — 403 error")
def test_dashboard_summary_forbidden():
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


@pytest.fixture
def profile_owner_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _PROFILE_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
