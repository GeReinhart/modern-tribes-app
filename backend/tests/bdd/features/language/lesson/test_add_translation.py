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

FEATURE = "../../../../features/features/language/lesson/add_translation.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "POST a brand-new translation to an existing word — it is created and linked")
def test_add_translation_new_word():
    pass


@scenario(FEATURE, "POST an existing word as a translation to another existing word — they are linked")
def test_add_translation_existing_word():
    pass


@scenario(FEATURE, "POST a translation that is already linked — 409 and nothing changes")
def test_add_translation_duplicate():
    pass


@scenario(FEATURE, "POST a word as its own translation — 422 and nothing changes")
def test_add_translation_self():
    pass


@scenario(FEATURE, "POST a translation to an unknown word — 404")
def test_add_translation_word_not_found():
    pass
