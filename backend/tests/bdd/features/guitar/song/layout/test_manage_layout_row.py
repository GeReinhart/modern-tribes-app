import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.layout.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../../features/features/guitar/song/layout/manage_layout_row.feature"


@scenario(FEATURE, "PUT a row's columns — the old columns are archived and the new ones are active")
def test_replace_layout_row():
    pass


@scenario(FEATURE, "Manager moves the second row up — it swaps position with the first")
def test_move_layout_row():
    pass


@scenario(FEATURE, "Manager removes a row — it and its columns and blocks are archived")
def test_remove_layout_row():
    pass


@scenario(FEATURE, "Member (not manager) tries to remove a row — 403 error and it stays active")
def test_remove_layout_row_as_member():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
