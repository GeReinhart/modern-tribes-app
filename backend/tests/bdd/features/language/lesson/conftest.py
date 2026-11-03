"""Steps stubbing the online translation service (DeepL) of the language lesson feature."""
import httpx
from pytest_bdd import given, parsers

from app.platform.core.config import settings

_MODULE = "app.features.language.lesson.online_translation"


@given(parsers.parse('the online translation service is configured and translates "{text}" into "{translation}"'))
def given_online_translation_configured(text, translation, monkeypatch):
    async def _fake_post(sent_text, source_language, target_language):
        assert sent_text == text
        return translation

    monkeypatch.setattr(settings, "DEEPL_API_KEY", "test-key")
    monkeypatch.setattr(f"{_MODULE}._post_translation", _fake_post)


@given("the online translation service is not configured")
def given_online_translation_not_configured(monkeypatch):
    monkeypatch.setattr(settings, "DEEPL_API_KEY", "")


@given("the online translation service is configured but fails")
def given_online_translation_fails(monkeypatch):
    async def _failing_post(*_args):
        raise httpx.ConnectError("service down")

    monkeypatch.setattr(settings, "DEEPL_API_KEY", "test-key")
    monkeypatch.setattr(f"{_MODULE}._post_translation", _failing_post)
