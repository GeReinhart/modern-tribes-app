import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.language.result.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/language/result/competition_participation.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()



@scenario(FEATURE, "GET the participation — a user who never chose takes part")
def test_get_participation_default():
    pass


@scenario(FEATURE, "PUT the participation to false — the user leaves the competition")
def test_put_participation_leave():
    pass


@scenario(FEATURE, "PUT the participation to true — the user joins again, without a duplicate row")
def test_put_participation_join():
    pass


@scenario(FEATURE, "PUT the participation — another member's choice is left untouched")
def test_put_participation_isolated():
    pass


@scenario(FEATURE, "GET and PUT the participation as a user without access to the project's tribe — 403")
def test_participation_forbidden():
    pass


@scenario(FEATURE, "PUT the participation without a boolean value — 422")
def test_put_participation_invalid():
    pass
