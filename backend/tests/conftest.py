from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.platform.core.authentication.router import get_current_user
from app.platform.functions.people.persons.router import router as persons_router

_test_app = FastAPI()
_test_app.include_router(persons_router, prefix="/api/platform/functions/people")

_ADMIN_USER = {"id": "00000000-0000-0000-0000-000000000001", "email": "admin@test.com"}
_REGULAR_USER = {"id": "00000000-0000-0000-0000-000000000002", "email": "user@test.com"}
_PROFILE_USER = {"id": "00000000-0000-0000-0000-000000000003", "email": "profile_user@test.com"}


class FakeAuthStore:
    USERS = [
        {"id": "00000000-0000-0000-0000-000000000001", "email": "admin@test.com", "status": "active"},
        {"id": "00000000-0000-0000-0000-000000000002", "email": "user@test.com", "status": "active"},
        {"id": "00000000-0000-0000-0000-000000000003", "email": "profile_user@test.com", "status": "active"},
    ]
    ROLES = [
        {"name": "administrator", "status": "active"},
        {"name": "viewer", "status": "active"},
        {"name": "profile-owner", "status": "active"},
    ]
    ROLE_PERMISSIONS = [
        {"role": "administrator", "permission": "admin"},
        {"role": "viewer", "permission": "can_access_attached_tribes"},
        {"role": "profile-owner", "permission": "can_manage_own_profile"},
    ]
    USER_ROLES = [
        {"user": "admin@test.com", "role": "administrator"},
        {"user": "user@test.com", "role": "viewer"},
        {"user": "profile_user@test.com", "role": "profile-owner"},
    ]


class FakeStore:
    def __init__(self):
        self._records: list[dict] = []

    def insert(self, record: dict) -> dict:
        self._records.append(record)
        return record

    def all(self) -> list[dict]:
        return list(self._records)

    def count(self) -> int:
        return len(self._records)

    def last(self) -> dict | None:
        return self._records[-1] if self._records else None

    def get_by_id(self, record_id: str) -> dict | None:
        return next((r for r in self._records if str(r.get("id")) == str(record_id)), None)

    def update(self, record_id: str, data: dict) -> dict | None:
        for i, r in enumerate(self._records):
            if str(r.get("id")) == str(record_id):
                clean = {k: str(v) if isinstance(v, UUID) else v for k, v in data.items()}
                self._records[i] = {**r, **clean}
                return dict(self._records[i])
        return None

    def archive(self, record_id: str) -> None:
        for i, r in enumerate(self._records):
            if str(r.get("id")) == str(record_id):
                self._records[i]["status"] = "archived"
                return

    def clear(self) -> None:
        self._records.clear()


class FakePersonsStore(FakeStore):
    pass


class FakeUsersStore(FakeStore):
    pass


class FakeRepresentsStore(FakeStore):
    pass


def _make_fake_create_document(store: FakeStore, table_name: str):
    async def fake_create_document(pool, table, data):
        now = datetime(2024, 1, 1, 0, 0, 0)
        record = {k: str(v) if isinstance(v, UUID) else v for k, v in data.items()}
        record["id"] = str(uuid4())
        record["created_at"] = now
        record["updated_at"] = now
        record.setdefault("url_param_id", uuid4().hex[:6])
        if table == table_name:
            store.insert(record)
        return record
    return fake_create_document


def _make_fake_check_document_exists(store: FakeStore):
    async def fake_check(pool, table, record_id, entity_name):
        record = store.get_by_id(str(record_id))
        if record is None:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail=f"{entity_name} not found")
        return record
    return fake_check


def _make_fake_update_document(store: FakeStore):
    async def fake_update(pool, table, record_id, data, entity_name):
        return store.update(str(record_id), data)
    return fake_update


def _make_fake_delete_document(store: FakeStore):
    async def fake_delete(pool, table, record_id, entity_name):
        store.archive(str(record_id))
    return fake_delete


@pytest.fixture
def auth_store() -> FakeAuthStore:
    return FakeAuthStore()


@pytest.fixture
def persons_store() -> FakePersonsStore:
    return FakePersonsStore()


@pytest.fixture
def managed_users_store() -> FakeUsersStore:
    return FakeUsersStore()


@pytest.fixture
def created_users_store() -> FakeUsersStore:
    return FakeUsersStore()


@pytest.fixture
def represents_store() -> FakeRepresentsStore:
    return FakeRepresentsStore()


@pytest.fixture
def context() -> dict:
    return {}


@pytest.fixture
def admin_client(persons_store: FakePersonsStore):
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.platform.functions.people.persons.router.get_database", return_value=MagicMock()),
        patch("app.platform.functions.people.persons.router.create_document",
              new=AsyncMock(side_effect=_make_fake_create_document(persons_store, "persons"))),
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
        patch("app.platform.functions.people.persons.router.create_document",
              new=AsyncMock(side_effect=_make_fake_create_document(persons_store, "persons"))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
