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

FEATURE = "../../../../features/features/language/test/submit_test_answer.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(
    FEATURE,
    "POST a correct free-translation answer for a word tested for the first time — "
    "the word's score reflects one of the six needed successes",
)
def test_submit_free_answer_correct():
    pass


@scenario(FEATURE, "POST a wrong free-translation answer — the correct answer is given back and no credit is added")
def test_submit_free_answer_wrong():
    pass


@scenario(
    FEATURE,
    "POST a correct multiple-choice answer on a different day than a previous free success — "
    "it adds only a fifth of a day's credit",
)
def test_submit_choice_answer_correct():
    pass


@scenario(
    FEATURE,
    "POST a multiple-choice answer when the lesson has fewer than 4 words of the same type — "
    "422 and no attempt is recorded",
)
def test_submit_choice_answer_not_enough_words():
    pass


@scenario(
    FEATURE,
    "POST a test answer as a user without access to the project's tribe — 403 and no attempt is recorded",
)
def test_submit_answer_forbidden():
    pass
