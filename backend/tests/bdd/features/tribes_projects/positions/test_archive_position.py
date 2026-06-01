from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.tribes_projects.positions.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, FakePositionsStore, _make_fake_delete_document

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/features/tribes-projects")

FEATURE = "../../../../features/features/tribes_projects/positions/archive_position.feature"


@scenario(FEATURE, "DELETE /positions/0010 as admin — position is archived")
def test_archive_admin():
    pass


@scenario(FEATURE, "DELETE /positions/0010 as a viewer — 403 error and the position is not archived")
def test_archive_forbidden():
    pass

@pytest.fixture
def admin_client(positions_store: FakePositionsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.features.tribes_projects.positions.router.get_database", return_value=MagicMock()),
        patch("app.features.tribes_projects.positions.router.delete_document",
              new=AsyncMock(side_effect=_make_fake_delete_document(positions_store))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()

@pytest.fixture
def non_admin_client(positions_store: FakePositionsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.features.tribes_projects.positions.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
