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

FEATURE = "../../../../features/features/language/test/get_effort.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "GET the effort — one entry per day from the first answer until today, weighted successes and errors, empty days included")
def test_get_effort_days():
    pass


@scenario(FEATURE, "GET the effort when nobody answered yet — no days")
def test_get_effort_empty():
    pass


@scenario(FEATURE, "GET the effort as a user without access to the project's tribe — 403")
def test_get_effort_forbidden():
    pass
