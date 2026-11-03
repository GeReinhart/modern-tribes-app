import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import router as auth_router
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(auth_router, prefix="/api/platform/core")

FEATURE = "../../../../features/platform/core/authentication/refresh_token.feature"


@scenario(FEATURE, "POST /authentication/refresh with a valid refresh token — new tokens are issued and the session lasts another 365 days")
def test_refresh_valid():
    pass


@scenario(FEATURE, "POST /authentication/refresh with a token that was rotated 1 minute ago (two tabs refreshing at once) — the session is still valid")
def test_refresh_within_grace():
    pass


@scenario(FEATURE, "POST /authentication/refresh with a token that was rotated more than 2 minutes ago — 401 refresh_token_reused")
def test_refresh_reused():
    pass


@scenario(FEATURE, "POST /authentication/refresh with an unknown token — 401 refresh_token_unknown")
def test_refresh_unknown():
    pass


@scenario(FEATURE, "POST /authentication/refresh after more than 365 days of inactivity — 401 refresh_token_expired")
def test_refresh_expired():
    pass


@scenario(FEATURE, "POST /authentication/refresh after the session was deleted (signed out) — 401 refresh_token_unknown")
def test_refresh_deleted_session():
    pass


@pytest.fixture(autouse=True)
def public_client(context):
    """The refresh endpoint is public: no authentication override, just a client."""
    with TestClient(_test_app) as test_client:
        context["client"] = test_client
        yield test_client
