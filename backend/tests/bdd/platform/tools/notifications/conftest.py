"""Steps and fake push service shared by the push delivery scenarios."""
import pytest
import requests
from pytest_bdd import given, parsers, then

from app.platform.core.config import settings


class FakePushService:
    """Stands in for pywebpush.webpush: records every call, answers per endpoint."""

    def __init__(self):
        self.calls: list[dict] = []
        self.behaviors: dict[str, str] = {}

    def __call__(self, subscription_info, data, vapid_private_key, vapid_claims, **kwargs):
        from pywebpush import WebPushException

        endpoint = subscription_info["endpoint"]
        behavior = self.behaviors.get(endpoint, "ok")
        if behavior == "sign_error":
            raise ValueError("signing failed")
        if behavior != "ok":
            response = requests.Response()
            response.status_code = int(behavior)
            raise WebPushException(f"Push failed: {behavior}", response=response)
        self.calls.append({"endpoint": endpoint, "subject": vapid_claims["sub"]})


@pytest.fixture
def fake_push(monkeypatch):
    fake = FakePushService()
    monkeypatch.setattr("pywebpush.webpush", fake)
    return fake


@given("VAPID keys are configured")
def given_vapid_keys(monkeypatch, fake_push):
    monkeypatch.setattr(settings, "VAPID_PUBLIC_KEY", "public-key")
    monkeypatch.setattr(settings, "VAPID_PRIVATE_KEY", "private-key")


@given(parsers.re(r'the VAPID subject setting is "(?P<subject>.*)"'))
def given_vapid_subject(subject, monkeypatch):
    monkeypatch.setattr(settings, "VAPID_SUBJECT", subject)


@given(parsers.parse('the push service answers "{status_code}" for endpoint "{endpoint}"'))
def given_push_answers(status_code, endpoint, fake_push):
    fake_push.behaviors[endpoint] = status_code


@given(parsers.parse('the push service fails to sign for endpoint "{endpoint}"'))
def given_push_sign_error(endpoint, fake_push):
    fake_push.behaviors[endpoint] = "sign_error"


@then(parsers.parse('the push service was called with subject "{subject}"'))
def then_push_subject(subject, fake_push):
    assert fake_push.calls, "the push service was never called"
    assert {c["subject"] for c in fake_push.calls} == {subject}


@then(parsers.parse('the push service received a push for endpoint "{endpoint}"'))
def then_push_received(endpoint, fake_push):
    assert endpoint in [c["endpoint"] for c in fake_push.calls]
