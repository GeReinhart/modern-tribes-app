from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.tasks.kanban.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER

_test_app = FastAPI()
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/kanban/archive_card.feature"

@scenario(FEATURE, "DELETE /kanban/cards/0010 as admin — the card is archived")
def test_archive_card_admin():
    pass

@scenario(FEATURE, "DELETE /kanban/cards/0010 as a viewer without project access — 403 error")
def test_archive_card_forbidden():
    pass

@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.features.tasks.kanban.router.get_database", return_value=MagicMock()),
        patch("app.features.tasks.kanban.repository.fetch_card",
              new=AsyncMock(return_value={"id": "card1", "feature_instance_id": "fi", "column_id": "col1", "title": "T", "assigned_person_id": None, "assigned_person_name": None, "document_id": None, "document_content_html": None, "position": 1, "status": "active", "size": None, "due_date": None, "label_ids": []})),
        patch("app.features.tasks.kanban.router._require_feature_access", new=AsyncMock(return_value="proj")),
        patch("app.features.tasks.kanban.repository.archive_card", new=AsyncMock(return_value=None)),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.features.tasks.kanban.router.get_database", return_value=MagicMock()),
        patch("app.features.tasks.kanban.repository.fetch_card",
              new=AsyncMock(return_value={"id": "card1", "feature_instance_id": "fi", "column_id": "col1", "title": "T", "assigned_person_id": None, "assigned_person_name": None, "document_id": None, "document_content_html": None, "position": 1, "status": "active", "size": None, "due_date": None, "label_ids": []})),
        patch("app.features.tasks.kanban.router._require_feature_access",
              new=AsyncMock(side_effect=__import__("fastapi").HTTPException(403, "No access"))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
