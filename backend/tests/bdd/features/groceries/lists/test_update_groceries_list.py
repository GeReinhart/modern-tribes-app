import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.groceries.lists.router import lists_router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(lists_router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/groceries/lists/update_groceries_list.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "PATCH /groceries-lists/4001 as a project member — the list is archived")
def test_update_list_archive():
    pass


@scenario(FEATURE, "PATCH /groceries-lists/4001 as a project member — the list is marked as favorite")
def test_update_list_favorite():
    pass


@scenario(FEATURE, "PATCH /groceries-lists/4001 as a project member — an archived list is restored to active")
def test_update_list_restore():
    pass


@scenario(FEATURE, "PATCH /groceries-lists/4001 as a project member — the scheduled date is changed")
def test_update_list_scheduled_date():
    pass


@scenario(FEATURE, "PATCH /groceries-lists/4001 as a project guest — 403 error and the list is not archived")
def test_update_list_forbidden():
    pass


@scenario(FEATURE, "PATCH /groceries-lists/9999 on a non-existent list — 404 error")
def test_update_list_not_found():
    pass


@scenario(FEATURE, "PATCH /groceries-lists/4001 as a project member — the list is renamed")
def test_update_list_rename():
    pass
