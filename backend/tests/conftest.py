import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.platform.core.authentication.router import get_current_user
from app.platform.functions.people.persons.router import router as persons_router
from tests.db_helpers import setup_test_database, truncate_all_tables, db_lifespan

_ADMIN_USER = {"id": "00000000-0000-0000-0000-000000000001", "email": "admin@test.com"}
_REGULAR_USER = {"id": "00000000-0000-0000-0000-000000000002", "email": "user@test.com"}
_PROFILE_USER = {"id": "00000000-0000-0000-0000-000000000003", "email": "profile_user@test.com"}


def pytest_configure(config):
    """Create and migrate the test database once per session."""
    setup_test_database()


@pytest.fixture(autouse=True)
def clean_test_db():
    """Truncate all tables before each test."""
    truncate_all_tables()
    yield


@pytest.fixture
def context() -> dict:
    return {}


# Shared persons-router app (used by platform/people/persons tests)
_persons_app = FastAPI(lifespan=db_lifespan)
_persons_app.include_router(persons_router, prefix="/api/platform/functions/people")


@pytest.fixture
def admin_client():
    _persons_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with TestClient(_persons_app) as client:
        yield client
    _persons_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client():
    _persons_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_persons_app) as client:
        yield client
    _persons_app.dependency_overrides.clear()
