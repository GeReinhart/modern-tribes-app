import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.groceries.lists.router import lists_router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(lists_router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/groceries/lists/get_groceries_list.feature"


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


@scenario(FEATURE, "GET /groceries-lists/0201 as a project member — the list and its items are returned")
def test_get_groceries_list_as_member():
    pass


@scenario(FEATURE, "GET /groceries-lists/0201 as an administrator — the list and its items are returned")
def test_get_groceries_list_as_admin():
    pass


@scenario(FEATURE, "GET /groceries-lists/0201 without project access — 403 error")
def test_get_groceries_list_forbidden():
    pass


@scenario(FEATURE, "GET /groceries-lists/9999 on a non-existent list — 404 error")
def test_get_groceries_list_not_found():
    pass


@scenario(FEATURE, "GET /groceries-lists/0202 — a planned list past its date is shown as passed")
def test_get_groceries_list_planned_becomes_passed():
    pass


@scenario(FEATURE, "GET /groceries-lists/0203 — a done list past its date still shows as done")
def test_get_groceries_list_done_stays_done():
    pass


@scenario(FEATURE, "GET /groceries-lists/0204 — a list scheduled for today is still planned")
def test_get_groceries_list_today_still_planned():
    pass
