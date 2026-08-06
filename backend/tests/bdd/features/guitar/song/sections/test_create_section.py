import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.guitar.song.sections.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../../../features/features/guitar/song/sections/create_section.feature"


@scenario(FEATURE, "POST the first section of a type onto a song — the display label carries no number")
def test_create_first_section():
    pass


@scenario(FEATURE, "POST a section sharing its type with an existing section — both get numbered")
def test_create_second_section_same_type():
    pass


@scenario(FEATURE, "POST a section as a guest — 403 and the database is not modified")
def test_create_section_as_guest():
    pass


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
