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

FEATURE = "../../../../features/features/language/lesson/get_language_pair.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "GET the language pair of a project that has one set — it is returned")
def test_get_language_pair_success():
    pass


@scenario(FEATURE, "GET the language pair of a project that has none set yet — 404")
def test_get_language_pair_not_found():
    pass


@scenario(FEATURE, "GET the language pair as a user without access to the project's tribe — 403")
def test_get_language_pair_forbidden():
    pass
