import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.sections.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../../features/features/guitar/song/sections/archive_section.feature"


@scenario(FEATURE, "Manager removes a section — it is archived")
def test_archive_section():
    pass


@scenario(FEATURE, "Manager tries to remove a section that another section is linked to — 409 and it stays active")
def test_archive_section_with_active_links():
    pass


@scenario(FEATURE, "Member (not manager) tries to remove a section — 403 error and it stays active")
def test_archive_section_forbidden():
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
