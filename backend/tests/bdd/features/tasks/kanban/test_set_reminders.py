import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.tasks.kanban.router import router
from app.features.tasks.kanban.card_router import card_router
from app.features.glue.features.router import router as glue_router
from app.features.tribes_projects.projects.router import router as projects_router
from app.features.tribes_projects.tribes.router import router as tribes_router
from app.features.tribes_projects.positions.router import router as positions_router
from tests.conftest import _ADMIN_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")
_test_app.include_router(card_router, prefix="/api/features/tasks")
_test_app.include_router(glue_router, prefix="/api/features/glue")
_test_app.include_router(projects_router, prefix="/api/features/tribes-projects")
_test_app.include_router(tribes_router, prefix="/api/features/tribes-projects")
_test_app.include_router(positions_router, prefix="/api/features/tribes-projects")

FEATURE = "../../../../features/features/tasks/kanban/set_reminders.feature"


@scenario(FEATURE, "Setting a push reminder pre-creates a planned notification for the creator")
def test_set_reminders_creates_notification_for_creator():
    pass


@scenario(FEATURE, "Setting a mail reminder does not create notifications")
def test_set_mail_reminder_no_notifications():
    pass


@scenario(FEATURE, "Re-setting reminders archives old notifications and creates new ones")
def test_reset_reminders_archives_old_notifications():
    pass


@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
