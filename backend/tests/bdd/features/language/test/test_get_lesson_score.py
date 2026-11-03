import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.language.test.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/language/test/get_lesson_score.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(
    FEATURE,
    "GET a lesson's score — it is the average of its words' scores, recently tested so no decay applies",
)
def test_get_lesson_score_average():
    pass


@scenario(
    FEATURE,
    "GET a lesson's score — a word untested for two full weeks has its score decayed by 10% per week",
)
def test_get_lesson_score_decay():
    pass


@scenario(FEATURE, "GET a lesson's score as a user without access to the project's tribe — 403")
def test_get_lesson_score_forbidden():
    pass
