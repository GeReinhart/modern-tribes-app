import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.platform.core.authentication.router import get_current_user
from app.platform.functions.people.persons.router import router as persons_router
from pytest_bdd import scenario
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(persons_router, prefix="/api/platform/functions/people")

FEATURE = "../../../../features/platform/people/persons/archive_person.feature"

@scenario(FEATURE, "DELETE /persons/0010 as admin — person is archived")
def test_archive_person_admin():
    pass

@scenario(FEATURE, "DELETE /persons/0010 as a viewer — 403 error and the person is not archived")
def test_archive_person_forbidden():
    pass

@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()

@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
