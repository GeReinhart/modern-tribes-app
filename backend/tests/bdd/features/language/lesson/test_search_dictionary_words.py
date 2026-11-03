import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.language.lesson.router import router
from tests.conftest import _PROFILE_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/language/lesson/search_dictionary_words.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def profile_owner_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _PROFILE_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(
    FEATURE,
    "GET dictionary words by prefix on the source-language side — matches starting with the prefix are returned",
)
def test_search_dictionary_words_source_side():
    pass


@scenario(
    FEATURE,
    "GET dictionary words by prefix — results are ranked shortest-first, the closest match to what was typed",
)
def test_search_dictionary_words_ranked_shortest_first():
    pass


@scenario(
    FEATURE,
    "GET dictionary words by prefix on the target-language side — the archive serves both sides",
)
def test_search_dictionary_words_target_side():
    pass


@scenario(FEATURE, "GET dictionary words with no bundled dictionary for the pair — an empty list is returned")
def test_search_dictionary_words_no_archive():
    pass


@scenario(FEATURE, "GET dictionary words as a user with no role at all — 403")
def test_search_dictionary_words_forbidden():
    pass
