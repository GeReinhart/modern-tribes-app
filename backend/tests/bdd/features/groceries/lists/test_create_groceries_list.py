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

FEATURE = "../../../../features/features/groceries/lists/create_groceries_list.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "POST /groceries-lists/ as a project member — the list is created")
def test_create_groceries_list_success():
    pass


@scenario(FEATURE, "POST /groceries-lists/ without a name or assignee — they default to empty")
def test_create_groceries_list_defaults():
    pass


@scenario(FEATURE, "POST /groceries-lists/ without a scheduled_date — 422 error and the database is not modified")
def test_create_groceries_list_missing_date():
    pass


@scenario(FEATURE, "POST /groceries-lists/ as a project guest — 403 error and the database is not modified")
def test_create_groceries_list_guest_forbidden():
    pass


@scenario(FEATURE, "POST /groceries-lists/ with copy_from_list_id — the favorite list's items are copied to the new list")
def test_create_groceries_list_copy_from_favorite():
    pass


@scenario(
    FEATURE, "POST /groceries-lists/ with a copy_from_list_id from another feature instance — 404 error and no list is created"
)
def test_create_groceries_list_copy_from_other_instance_forbidden():
    pass
