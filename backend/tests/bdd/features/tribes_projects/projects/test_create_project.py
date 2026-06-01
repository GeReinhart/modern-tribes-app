from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.tribes_projects.projects.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, FakeProjectsStore, _make_fake_create_document

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/features/tribes-projects")

FEATURE = "../../../../features/features/tribes_projects/projects/create_project.feature"


@scenario(FEATURE, "POST /projects/ with valid body as admin — the project is created")
def test_create_admin():
    pass


@scenario(FEATURE, "POST /projects/ with missing name — 422 error and the database is not modified")
def test_create_missing_field():
    pass


@scenario(FEATURE, "POST /projects/ as a viewer — 403 error and the database is not modified")
def test_create_forbidden():
    pass

@pytest.fixture
def admin_client(projects_store: FakeProjectsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.features.tribes_projects.projects.router.get_database", return_value=MagicMock()),
        patch("app.features.tribes_projects.projects.router.create_document",
              new=AsyncMock(side_effect=_make_fake_create_document(projects_store, "projects"))),
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
