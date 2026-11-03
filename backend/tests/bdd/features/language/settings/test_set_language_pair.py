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

FEATURE = "../../../../features/features/language/settings/set_language_pair.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "POST a language pair for a project with no settings yet — the pair is saved")
def test_set_language_pair_success():
    pass


@scenario(FEATURE, "POST a language pair for a project that already has one — 409 and the pair is unchanged")
def test_set_language_pair_already_set():
    pass


@scenario(FEATURE, "POST a language pair with an unknown language code — 422 and nothing is saved")
def test_set_language_pair_unknown_language():
    pass


@scenario(
    FEATURE,
    "POST a language pair as a user without access to the project's tribe — 403 and nothing is saved",
)
def test_set_language_pair_forbidden():
    pass
