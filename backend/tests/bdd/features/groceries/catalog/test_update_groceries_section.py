import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.groceries.catalog.router import sections_router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(sections_router, prefix="/api/features/tasks")

FEATURE = "../../../../features/features/groceries/catalog/update_groceries_section.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "PATCH /groceries-sections/4001 as a project member — the section is renamed")
def test_update_section_success():
    pass


@scenario(FEATURE, "PATCH /groceries-sections/4001 with only an icon — the name is unchanged")
def test_update_section_icon_only():
    pass


@scenario(FEATURE, "PATCH /groceries-sections/4001 as a project guest — 403 error and the section is not renamed")
def test_update_section_forbidden():
    pass


@scenario(FEATURE, "PATCH /groceries-sections/9999 on a non-existent section — 404 error")
def test_update_section_not_found():
    pass
