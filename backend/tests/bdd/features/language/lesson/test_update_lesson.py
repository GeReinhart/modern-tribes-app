import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.language.lesson.router import router as lesson_router
from app.features.language.learn.router import router as learn_router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(lesson_router, prefix="/api/features/tasks")
_test_app.include_router(learn_router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/language/lesson/update_lesson.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "PATCH a lesson's title — it is renamed")
def test_update_lesson_title():
    pass


@scenario(
    FEATURE,
    "PATCH a lesson's document content — the document is updated and the previous content becomes a revision",
)
def test_update_lesson_document():
    pass


@scenario(FEATURE, "PATCH an unknown lesson — 404")
def test_update_lesson_not_found():
    pass


@scenario(
    FEATURE,
    "PATCH a lesson as a user without access to the project's tribe — 403 and the lesson is unchanged",
)
def test_update_lesson_forbidden():
    pass
