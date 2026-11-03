import html

from weasyprint import HTML

from app.features.language.learn.models import LessonLearnResponse
from app.features.language.schemas import WordResponse

_WORD_TYPE_ORDER = ("noun", "adjective", "verb")
_DEFAULT_LANG = "en"
_WORD_TYPE_TITLES = {
    "en": {"noun": "Nouns", "adjective": "Adjectives", "verb": "Verbs"},
    "fr": {"noun": "Noms", "adjective": "Adjectifs", "verb": "Verbes"},
}

# Language names in the reader's language; a language missing here falls back to its stored name.
_LANGUAGE_NAMES = {
    "en": {"fr": "French", "en": "English", "de": "German"},
    "fr": {"fr": "Français", "en": "Anglais", "de": "Allemand"},
}

_CSS = (
    "body { font-family: Helvetica, Arial, sans-serif; color: #1a1a1a; }"
    "h1 { font-size: 22px; }"
    "h2 { font-size: 14px; margin: 18px 0 6px; padding-bottom: 2px; border-bottom: 2px solid #999999; }"
    ".document { margin-bottom: 16px; }"
    ".card { display: table; width: 100%; border: 1px solid #cccccc; border-radius: 4px;"
    " margin-bottom: 4px; padding: 3px 8px; box-sizing: border-box; break-inside: avoid; }"
    ".cell { display: table-cell; width: 50%; vertical-align: top; padding-right: 8px; }"
    ".entry { font-size: 13px; font-weight: 700; }"
    ".facts { color: #555555; font-size: 10px; }"
)


def render_lesson_pdf(lesson: LessonLearnResponse, learned_language: dict | None, lang: str = _DEFAULT_LANG) -> bytes:
    """`learned_language` is the {code, name} being learned; `lang` is the reader's interface
    language, used for the word-type group titles and the footer's language name."""
    return HTML(string=_build_html(lesson, _language_label(learned_language, lang), lang)).write_pdf()


def _language_label(learned_language: dict | None, lang: str) -> str:
    if learned_language is None:
        return ""
    names = _LANGUAGE_NAMES.get(lang, _LANGUAGE_NAMES[_DEFAULT_LANG])
    return names.get(learned_language["code"], learned_language["name"])


def _page_css(language_name: str) -> str:
    """A4 page with a footer: the learned language on the left, "page / total" on the right."""
    footer_style = "font-family: Helvetica, Arial, sans-serif; font-size: 9px; color: #666666;"
    language_literal = language_name.replace("\\", "\\\\").replace('"', '\\"')
    return (
        "@page { size: A4 portrait; margin: 15mm 12mm 18mm;"
        f' @bottom-left {{ content: "{language_literal}"; {footer_style} }}'
        f' @bottom-right {{ content: counter(page) " / " counter(pages); {footer_style} }} }}'
    )


def _build_html(lesson: LessonLearnResponse, language_name: str, lang: str) -> str:
    return (
        '<!doctype html><html><head><meta charset="utf-8" />'
        f"<style>{_page_css(language_name)} {_CSS}</style>"
        f"</head><body><h1>{html.escape(lesson.title)}</h1>"
        f'<div class="document">{lesson.document.content}</div>'
        f"{_render_words_by_type(lesson.words, lang)}</body></html>"
    )


def _entry_label(word: WordResponse) -> str:
    return " ".join(part for part in (html.escape(word.article or ""), html.escape(word.text)) if part)


def _render_facts(word: WordResponse) -> str:
    facts = []
    if word.plural:
        facts.append(f"pl. {html.escape(word.plural)}")
    facts.extend(f"{html.escape(d.case_label)}: {html.escape(d.form)}" for d in word.declensions)
    return f'<div class="facts">{", ".join(facts)}</div>' if facts else ""


def _render_entry(word: WordResponse) -> str:
    return f'<div><div class="entry">{_entry_label(word)}</div>{_render_facts(word)}</div>'


def _render_word(word: WordResponse) -> str:
    translations = "".join(_render_entry(t) for t in word.translations)
    return (
        '<div class="card">'
        f'<div class="cell">{_render_entry(word)}</div>'
        f'<div class="cell">{translations}</div>'
        "</div>"
    )


def _render_words_by_type(words: list[WordResponse], lang: str) -> str:
    titles = _WORD_TYPE_TITLES.get(lang, _WORD_TYPE_TITLES[_DEFAULT_LANG])
    sections = []
    for word_type in _WORD_TYPE_ORDER:
        group = [w for w in words if w.word_type == word_type]
        if group:
            cards = "".join(_render_word(w) for w in group)
            sections.append(f"<h2>{titles[word_type]}</h2>{cards}")
    return "".join(sections)
