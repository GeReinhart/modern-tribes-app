from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.platform.core.authentication.router import get_current_user
from app.platform.functions.people.represents.router import router as represents_router
from tests.conftest import (
    _ADMIN_USER,
    _REGULAR_USER,
    FakeRepresentsStore,
    _make_fake_delete_document,
)
from pytest_bdd import scenario

_test_app = FastAPI()
_test_app.include_router(represents_router, prefix="/api/platform/functions/people")

FEATURE = "../../../../features/platform/people/represents/archive_represents.feature"


@scenario(FEATURE, "DELETE /represents/0030 as admin — link is archived")
def test_archive_represents_admin():
    pass


@scenario(FEATURE, "DELETE /represents/0030 as a viewer — 403 error and the link is not archived")
def test_archive_represents_forbidden():
    pass


@pytest.fixture
def admin_client(represents_store: FakeRepresentsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.functions.people.represents.router.get_database", return_value=MagicMock()),
        patch("app.platform.functions.people.represents.router.delete_document",
              new=AsyncMock(side_effect=_make_fake_delete_document(represents_store))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client(represents_store: FakeRepresentsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.platform.functions.people.represents.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
