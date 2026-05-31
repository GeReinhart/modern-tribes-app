from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.platform.core.authentication.router import get_current_user
from app.platform.functions.people.persons.router import router as persons_router
from tests.conftest import (
    _ADMIN_USER,
    _REGULAR_USER,
    FakePersonsStore,
    _make_fake_delete_document,
)
from pytest_bdd import scenario

_test_app = FastAPI()
_test_app.include_router(persons_router, prefix="/api/platform/functions/people")

FEATURE = "../../../../features/platform/people/persons/archive_person.feature"


@scenario(FEATURE, "DELETE /persons/0010 as admin — person is archived")
def test_archive_person_admin():
    pass


@scenario(FEATURE, "DELETE /persons/0010 as a viewer — 403 error and the person is not archived")
def test_archive_person_forbidden():
    pass


@pytest.fixture
def admin_client(persons_store: FakePersonsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.functions.people.persons.router.get_database", return_value=MagicMock()),
        patch("app.platform.functions.people.persons.router.delete_document",
              new=AsyncMock(side_effect=_make_fake_delete_document(persons_store))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client(persons_store: FakePersonsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_attached_tribes"])),
        patch("app.platform.functions.people.persons.router.get_database", return_value=MagicMock()),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
