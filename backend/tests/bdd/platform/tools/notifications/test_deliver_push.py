import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.platform.tools.notifications.router import router
from tests.conftest import _ADMIN_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/platform/tools")

FEATURE = "../../../../features/platform/tools/notifications/deliver_push.feature"


@scenario(FEATURE, "POST /notifications/admin with a bare-email VAPID subject — push is signed with a mailto: subject")
def test_bare_email_subject_is_normalized():
    pass


@scenario(FEATURE, "POST /notifications/admin with a blank VAPID subject — push is signed with the default subject")
def test_blank_subject_uses_default():
    pass


@scenario(FEATURE, "POST /notifications/admin with an expired subscription — it is removed and the other one still receives the push")
def test_expired_subscription_is_removed():
    pass


@scenario(FEATURE, "POST /notifications/admin when signing fails on one subscription — the other one still receives the push")
def test_signing_error_does_not_stop_other_subscriptions():
    pass


@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()
