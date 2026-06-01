from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.tribes_projects.projects.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, FakeProjectsStore, _make_fake_check_document_exists, _make_fake_update_document

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/features/tribes-projects")

FEATURE = "../../../../features/features/tribes_projects/projects/update_project.feature"


@scenario(FEATURE, "PUT /projects/0010 with valid body as admin — the project is updated")
def test_update_admin():
    pass


@scenario(FEATURE, "PUT /projects/0010 as a viewer — 403 error and the project is not modified")
def test_update_forbidden():
    pass

@pytest.fixture
def admin_client(projects_store: FakeProjectsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.features.tribes_projects.projects.router.get_database", return_value=MagicMock()),
        patch("app.features.tribes_projects.projects.router.check_document_exists",
              new=AsyncMock(side_effect=_make_fake_check_document_exists(projects_store))),
        patch("app.features.tribes_projects.projects.router.update_document",
              new=AsyncMock(side_effect=_make_fake_update_document(projects_store))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()

@pytest.fixture
def non_admin_client(projects_store: FakeProjectsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.features.tribes_projects.projects.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
