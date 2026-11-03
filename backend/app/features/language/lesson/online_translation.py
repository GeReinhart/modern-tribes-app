"""Online translation fallback (DeepL API Free), used only when a user explicitly asks for it
because the bundled dictionary has no match. The API key stays on the server."""
import logging
import time

import httpx
from fastapi import HTTPException

from app.platform.core.config import settings

logger = logging.getLogger(__name__)

# DeepL needs a regional variant for English targets.
_DEEPL_TARGET_CODES = {"en": "EN-GB"}


def _error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"code": code, "message": message})


async def _post_translation(text: str, source_language: str, target_language: str) -> str:
    """One call to DeepL; returns the translated text. Raises httpx errors on any failure."""
    async with httpx.AsyncClient(timeout=settings.DEEPL_TIMEOUT_SECONDS) as client:
        response = await client.post(
            settings.DEEPL_API_URL,
            headers={"Authorization": f"DeepL-Auth-Key {settings.DEEPL_API_KEY}"},
            json={
                "text": [text],
                "source_lang": source_language.upper(),
                "target_lang": _DEEPL_TARGET_CODES.get(target_language.lower(), target_language.upper()),
            },
        )
        response.raise_for_status()
        return response.json()["translations"][0]["text"]


async def translate_word(text: str, source_language: str, target_language: str) -> str:
    if not settings.DEEPL_API_KEY:
        logger.warning("DeepL call skipped: DEEPL_API_KEY is not configured")
        raise _error(503, "online_translation_unavailable", "Online translation is not configured")
    logger.info("Calling DeepL: %s -> %s for %r", source_language, target_language, text)
    started = time.monotonic()
    try:
        translated = await _post_translation(text, source_language, target_language)
    except (httpx.HTTPError, KeyError, IndexError, ValueError) as exc:
        logger.warning("DeepL call failed after %.2fs: %r", time.monotonic() - started, exc)
        raise _error(502, "online_translation_failed", "The online translation service failed") from exc
    logger.info("DeepL answered %r in %.2fs", translated, time.monotonic() - started)
    return translated
