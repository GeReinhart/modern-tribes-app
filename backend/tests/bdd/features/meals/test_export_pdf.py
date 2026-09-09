import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.features.meals.pdf.router import router
from tests.conftest import _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/features/tasks")

FEATURE = "../../../features/features/meals/export_pdf.feature"


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "GET the PDF for a week with planned meals and a linked recipe — a valid PDF is returned")
def test_export_pdf_with_meals_and_recipe():
    pass


@scenario(FEATURE, "GET the PDF for a range with no planned meals — still a valid PDF, with just the empty table page")
def test_export_pdf_empty_range():
    pass


@scenario(FEATURE, "GET the PDF without project access — 403")
def test_export_pdf_forbidden():
    pass
