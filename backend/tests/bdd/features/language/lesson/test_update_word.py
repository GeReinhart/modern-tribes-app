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

FEATURE = "../../../../features/features/language/lesson/update_word.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "PATCH a word's own fields — they are updated and its declensions are replaced")
def test_update_word_success():
    pass


@scenario(FEATURE, "PATCH a word's text to one that already exists for that language — 409 and nothing changes")
def test_update_word_duplicate():
    pass


@scenario(FEATURE, "PATCH an unknown word — 404")
def test_update_word_not_found():
    pass
