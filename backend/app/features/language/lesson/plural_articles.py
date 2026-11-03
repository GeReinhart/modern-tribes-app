"""Plural definite articles per language. A bare plural ("chats") is ambiguous for machine
translation, so it is sent as "les chats" and the target's article is removed from the answer."""

PLURAL_ARTICLES: dict[str, tuple[str, ...]] = {
    "fr": ("les",),
    "en": ("the",),
    "de": ("die",),
    "nl": ("de",),
    "es": ("los", "las"),
    "pt": ("os", "as"),
    "it": ("i", "gli", "le"),
}


def with_plural_article(text: str, language: str) -> str:
    """`text` preceded by the language's plural article; unchanged when the language has none."""
    articles = PLURAL_ARTICLES.get(language.lower())
    return f"{articles[0]} {text}" if articles else text


def without_plural_article(text: str, language: str) -> str:
    """`text` without a leading plural article of the language (case-insensitive)."""
    for article in PLURAL_ARTICLES.get(language.lower(), ()):
        prefix = f"{article} "
        if text.lower().startswith(prefix):
            return text[len(prefix):].lstrip()
    return text
