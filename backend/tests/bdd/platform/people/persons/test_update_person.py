from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.platform.core.authentication.router import get_current_user
from app.platform.functions.people.persons.router import router as persons_router
from tests.conftest import (
    _ADMIN_USER,
    _PROFILE_USER,
    _REGULAR_USER,
    FakePersonsStore,
    _make_fake_check_document_exists,
    _make_fake_update_document,
)
from pytest_bdd import scenario

_test_app = FastAPI()
_test_app.include_router(persons_router, prefix="/api/platform/functions/people")

FEATURE = "../../../../features/platform/people/persons/update_person.feature"


@scenario(FEATURE, "PUT /persons/0010 as admin — person is updated")
def test_update_person_admin():
    pass


@scenario(FEATURE, "PUT /persons/0010 as the person's owner (CAN_MANAGE_OWN_PROFILE) — person is updated")
def test_update_person_profile_owner():
    pass


@scenario(FEATURE, "PUT /persons/0010 as a viewer — 403 error and the person is not modified")
def test_update_person_forbidden():
    pass


@pytest.fixture
def admin_client(persons_store: FakePersonsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.functions.people.persons.router.get_database", return_value=MagicMock()),
        patch("app.platform.functions.people.persons.router.check_own_person_or_admin",
              new=AsyncMock(return_value=None)),
        patch("app.platform.functions.people.persons.router.check_document_exists",
              new=AsyncMock(side_effect=_make_fake_check_document_exists(persons_store))),
        patch("app.platform.functions.people.persons.router.update_document",
              new=AsyncMock(side_effect=_make_fake_update_document(persons_store))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def profile_owner_client(persons_store: FakePersonsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _PROFILE_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_manage_own_profile"])),
        patch("app.platform.functions.people.persons.router.get_database", return_value=MagicMock()),
        patch("app.platform.functions.people.persons.router.check_own_person_or_admin",
              new=AsyncMock(return_value=None)),
        patch("app.platform.functions.people.persons.router.check_document_exists",
              new=AsyncMock(side_effect=_make_fake_check_document_exists(persons_store))),
        patch("app.platform.functions.people.persons.router.update_document",
              new=AsyncMock(side_effect=_make_fake_update_document(persons_store))),
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
