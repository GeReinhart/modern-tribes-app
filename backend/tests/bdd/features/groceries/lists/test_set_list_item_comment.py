import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.groceries.lists.router import list_items_router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(list_items_router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/groceries/lists/set_list_item_comment.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "PATCH /groceries-list-items/4001 to add a comment — the comment is saved")
def test_set_comment_success():
    pass


@scenario(FEATURE, "PATCH /groceries-list-items/4001 to clear a comment — the comment is removed")
def test_clear_comment_success():
    pass


@scenario(
    FEATURE,
    "PATCH /groceries-list-items/4001 with a comment as a project guest — "
    "403 error and the comment is not saved",
)
def test_set_comment_guest_forbidden():
    pass
