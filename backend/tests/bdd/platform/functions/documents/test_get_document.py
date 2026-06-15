from datetime import datetime
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario
from app.platform.core.authentication.router import get_current_user
from app.platform.functions.documents.router import router as documents_router
from tests.conftest import _ADMIN_USER, _REGULAR_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(documents_router, prefix="/api/platform/functions")

FEATURE = "../../../../features/platform/functions/documents/get_document.feature"

@scenario(FEATURE, "GET /documents/0010 as admin with existing record — returns the document")
def test_get_document_admin():
    pass

@scenario(FEATURE, "GET /documents/0010 as a viewer — 403 error")
def test_get_document_forbidden():
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
