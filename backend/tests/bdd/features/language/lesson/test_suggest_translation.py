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

FEATURE = "../../../../features/features/language/lesson/suggest_translation.feature"


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
    "GET translation candidates for a pair with no bundled dictionary — an empty result is returned, not an error",
)
def test_suggest_translations_no_archive():
    pass


@scenario(
    FEATURE,
    "GET translation candidates matching several senses of the same word — every candidate is returned, "
    "with its own context, word type and the typed word's own article",
)
def test_suggest_translations_multiple_senses():
    pass


@scenario(
    FEATURE,
    "GET translation candidates resolved from the reverse-direction archive — the article matches the requested target language",
)
def test_suggest_translations_reverse_direction():
    pass


@scenario(
    FEATURE,
    "GET translation candidates for a word not in the bundled dictionary — an empty result is returned",
)
def test_suggest_translations_not_found():
    pass


@scenario(FEATURE, "GET translation candidates as a user with no role at all — 403")
def test_suggest_translations_forbidden():
    pass
