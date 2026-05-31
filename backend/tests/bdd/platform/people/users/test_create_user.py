from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.platform.core.authentication.router import get_current_user
from app.platform.functions.people.users.router import router as users_router
from tests.conftest import (
    _ADMIN_USER,
    _REGULAR_USER,
    FakeUsersStore,
    _make_fake_create_document,
)
from pytest_bdd import scenario

_test_app = FastAPI()
_test_app.include_router(users_router, prefix="/api/platform/functions/people")

FEATURE = "../../../../features/platform/people/users/create_user.feature"


@scenario(FEATURE, "POST /users/ with a valid body as admin — the new record appears in the database")
def test_create_user_success():
    pass


@scenario(FEATURE, "POST /users/ with a missing required field — 422 error and the database is not modified")
def test_create_user_missing_field():
    pass


@scenario(FEATURE, "POST /users/ as a viewer — 403 error and the database is not modified")
def test_create_user_forbidden():
    pass


@pytest.fixture
def admin_client(created_users_store: FakeUsersStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.functions.people.users.router.get_database", return_value=MagicMock()),
        patch("app.platform.functions.people.users.router.check_unique_field",
              new=AsyncMock(return_value=None)),
        patch("app.platform.functions.people.users.router.create_document",
              new=AsyncMock(side_effect=_make_fake_create_document(created_users_store, "users"))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client(created_users_store: FakeUsersStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.platform.functions.people.users.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
