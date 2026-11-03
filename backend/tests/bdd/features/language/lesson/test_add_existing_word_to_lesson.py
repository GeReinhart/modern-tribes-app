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

FEATURE = "../../../../features/features/language/lesson/add_existing_word_to_lesson.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(
    FEATURE,
    "POST an existing word, originally created from a different project, to this lesson — it is added",
)
def test_add_existing_word_success():
    pass


@scenario(FEATURE, "POST a word that is already in the lesson — 409 and the lesson's word list is unchanged")
def test_add_existing_word_already_in_lesson():
    pass


@scenario(FEATURE, "POST an unknown word id to a lesson — 404 and nothing is added")
def test_add_existing_word_not_found():
    pass


@scenario(
    FEATURE,
    "POST an existing word to a lesson as a user without access to the project's tribe — 403 and nothing is added",
)
def test_add_existing_word_forbidden():
    pass
