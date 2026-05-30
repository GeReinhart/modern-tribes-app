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


class FakePersonsStore:
    def __init__(self):
        self._records: list[dict] = []

    def count(self) -> int:
        return len(self._records)

    def insert(self, record: dict) -> dict:
        self._records.append(record)
        return record

    def all(self) -> list[dict]:
        return list(self._records)

    def last(self) -> dict | None:
        return self._records[-1] if self._records else None


def _make_fake_create_document(persons_store: FakePersonsStore):
    async def fake_create_document(pool, table, data):
        now = datetime(2024, 1, 1, 0, 0, 0)
        record = {k: str(v) if isinstance(v, UUID) else v for k, v in data.items()}
        record["id"] = str(uuid4())
        record["created_at"] = now
        record["updated_at"] = now
        if table == "persons":
            persons_store.insert(record)
        return record
    return fake_create_document


@pytest.fixture
def persons_store() -> FakePersonsStore:
    return FakePersonsStore()


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
              new=AsyncMock(side_effect=_make_fake_create_document(persons_store))),
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
              new=AsyncMock(return_value=["can_access_own_tribes"])),
        patch("app.platform.functions.people.persons.router.get_database", return_value=MagicMock()),
        patch("app.platform.functions.people.persons.router.create_document",
              new=AsyncMock(side_effect=_make_fake_create_document(persons_store))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
