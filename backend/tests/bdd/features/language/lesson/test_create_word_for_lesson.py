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

FEATURE = "../../../../features/features/language/lesson/create_word_for_lesson.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(
    FEATURE,
    "POST a new word with a brand-new translation — both words are created, linked, and the word is added to the lesson",
)
def test_create_word_new_translation():
    pass


@scenario(
    FEATURE,
    "POST a new word whose translation already exists in the global dictionary — the existing word is reused, not duplicated",
)
def test_create_word_reuses_existing_translation():
    pass


@scenario(FEATURE, "POST a new word whose text already exists for that language — 409 and nothing is created")
def test_create_word_duplicate_text():
    pass


@scenario(
    FEATURE,
    "POST a new word as a user without access to the project's tribe — 403 and nothing is created",
)
def test_create_word_forbidden():
    pass
