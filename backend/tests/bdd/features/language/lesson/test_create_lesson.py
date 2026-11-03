import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.language.lesson.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/language/lesson/create_lesson.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(
    FEATURE,
    "POST a lesson in a project with a language pair already set — the lesson is created with an empty document",
)
def test_create_lesson_success():
    pass


@scenario(FEATURE, "POST a lesson in a project with no language pair set yet — 422 and no lesson is created")
def test_create_lesson_no_language_pair():
    pass


@scenario(FEATURE, "POST a lesson as a user without access to the project's tribe — 403 and no lesson is created")
def test_create_lesson_forbidden():
    pass
