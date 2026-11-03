"""Translation candidates from the dict.cc exports bundled in this repo under
``backend/app/features/language/data/`` — no external service, no network call, nothing to
configure. Each pair ships as a zip archive named ``dict.<source>.<target>.zip`` (e.g.
``dict.de.fr.zip``) containing exactly one dict.cc-format text file.

The dict.cc TSV format (headword, translation, word type, subject domain, one entry per
line; '#'-prefixed lines are header/license comments) and its HTML-numeric-entity
encoding are reverse-engineered from the parser in
https://github.com/michaelgoetze/Dict.Offline/blob/master/src/dictionary/Dictionary.java.

A single headword (once its [usage]/{gender} markup is stripped for matching) commonly
maps to several dict.cc lines for different senses — e.g. "Haus {n} [Gebäude]" (building)
and "Haus {n} [Haushalt, Hausgemeinschaft, Familie]" (household) both translate "Haus" but
mean different things. Rather than guessing, every distinct candidate is returned (each
carrying the matched headword's own [bracketed] sense as `context`, when dict.cc gives
one) so the user picks the one they meant.

A word's {m}/{f}/{n} gender tag (also seen combined, e.g. {f.pl}) lets an article be
suggested alongside each candidate's translation. A plural form is deliberately NOT
suggested: dict.cc lists a plural as its own separate headword (e.g. "Häuser {pl}" next
to, not combined with, "Haus {n}"), so there is no reliable way to derive "the" plural of
a matched singular entry from a single dictionary line.

Lookups work in either direction — the same archive serves "source to target" and
"target to source" (swapping which column is the headword), so suggesting from the left
or the right column of the add-word form both resolve through the same bundled files.

Each candidate also carries `word_type` (dict.cc's part-of-speech column — the same part
of speech on both sides of the entry, e.g. a noun translates to a noun) and
`source_article`, the headword's own article — unlike `word_type`, gender/article differs
by language, so it needs computing separately from `article` (the translation's own
article). Together these let a match confirm the typed word's own grammar (type,
article) while it's still being typed, not just suggest its translation.

Never raises: a missing archive for a pair, or a word with no match, both simply mean "no
suggestions", since the translation can always be typed in by hand instead.
"""
import html
import re
import zipfile
from pathlib import Path
from typing import NamedTuple, Optional

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

_MAX_CANDIDATES = 8

_BRACKETED = re.compile(r"\[.+?\]|\{.+?\}|<.+?>")
_WHITESPACE = re.compile(r"\s+")
_GENDER = re.compile(r"\{(m|f|n)(?:\.[a-z]+)?\}")
_CONTEXT = re.compile(r"\[(.+?)\]")

# Only languages where dict.cc's {m}/{f}/{n} gender tag maps onto a real article are
# listed here — a language with no entry here (e.g. English) simply gets no article.
_ARTICLES_BY_LANGUAGE: dict[str, dict[str, str]] = {
    "fr": {"m": "le", "f": "la"},
    "de": {"m": "der", "f": "die", "n": "das"},
}


_WORD_TYPES_BY_DICTCC_TYPE: dict[str, str] = {
    "noun": "noun",
    "verb": "verb",
    "adj": "adjective",
}


class DictionaryCandidate(NamedTuple):
    text: str
    article: Optional[str]
    context: Optional[str]
    word_type: Optional[str]
    source_article: Optional[str]


class DictionaryWord(NamedTuple):
    text: str
    word_type: Optional[str]
    article: Optional[str]


_cache: dict[tuple[str, str, str], dict[str, list[DictionaryCandidate]]] = {}
_side_cache: dict[tuple[str, str, str], tuple[list[tuple[str, "DictionaryWord"]], list[tuple[str, "DictionaryWord"]]]] = {}


def _clean(entry: str) -> str:
    """Decodes dict.cc's HTML-numeric-entity encoding and strips the {gender}/[usage]/
    <alternate-form> annotations dict.cc attaches to a headword or translation."""
    cleaned = _BRACKETED.sub("", html.unescape(entry))
    return _WHITESPACE.sub(" ", cleaned).strip()


def _article_for(language: str, raw_translation: str) -> Optional[str]:
    match = _GENDER.search(raw_translation)
    if match is None:
        return None
    return _ARTICLES_BY_LANGUAGE.get(language, {}).get(match.group(1))


def _context_of(raw_headword: str) -> Optional[str]:
    match = _CONTEXT.search(raw_headword)
    return match.group(1) if match else None


def _locate_archive(source: str, target: str) -> tuple[Path, bool] | None:
    forward = DATA_DIR / f"dict.{source.lower()}.{target.lower()}.zip"
    if forward.is_file():
        return forward, False
    reverse = DATA_DIR / f"dict.{target.lower()}.{source.lower()}.zip"
    if reverse.is_file():
        return reverse, True
    return None


def _read_archive_text(path: Path) -> str:
    """Each archive holds exactly one entries file, under an arbitrary, non-predictable
    name — so the first (only) entry in the archive is read, not a fixed filename."""
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        if not names:
            return ""
        return archive.read(names[0]).decode("utf-8")


def _word_type_of(raw_type: str) -> Optional[str]:
    """dict.cc's own word-type column applies to the whole entry — the same part of
    speech on both the headword and its translation (a noun translates to a noun) — so,
    unlike article (gender differs by language), this needs no per-side handling."""
    return _WORD_TYPES_BY_DICTCC_TYPE.get(raw_type.strip().lower())


def _candidate_from_line(
    headword_raw: str, translation_raw: str, raw_type: str, source: str, target: str,
) -> DictionaryCandidate:
    return DictionaryCandidate(
        text=_clean(translation_raw),
        article=_article_for(target, translation_raw),
        context=_context_of(headword_raw),
        word_type=_word_type_of(raw_type),
        source_article=_article_for(source, headword_raw),
    )


def _parse_lines(text: str, swap: bool, source: str, target: str) -> dict[str, list[DictionaryCandidate]]:
    """headword (lowercased) -> every distinct candidate translation seen for it, in
    file order, capped at _MAX_CANDIDATES."""
    by_headword: dict[str, list[DictionaryCandidate]] = {}
    for line in text.splitlines():
        if line.startswith("#"):
            continue
        fields = line.split("\t")
        if len(fields) < 2:
            continue
        headword_raw, translation_raw = (fields[1], fields[0]) if swap else (fields[0], fields[1])
        headword = _clean(headword_raw).lower()
        if not headword:
            continue
        bucket = by_headword.setdefault(headword, [])
        if len(bucket) >= _MAX_CANDIDATES:
            continue
        raw_type = fields[2] if len(fields) > 2 else ""
        candidate = _candidate_from_line(headword_raw, translation_raw, raw_type, source, target)
        if candidate not in bucket:
            bucket.append(candidate)
    return by_headword


def _load_dictionary(source: str, target: str) -> dict[str, list[DictionaryCandidate]] | None:
    cache_key = (str(DATA_DIR), source, target)
    if cache_key in _cache:
        return _cache[cache_key]
    located = _locate_archive(source, target)
    if located is None:
        return None
    path, swapped = located
    words = _parse_lines(_read_archive_text(path), swapped, source, target)
    _cache[cache_key] = words
    return words


def suggest_translations(source: str, target: str, text: str) -> list[DictionaryCandidate]:
    words = _load_dictionary(source, target)
    if words is None:
        return []
    return words.get(text.strip().lower(), [])


def _word_for_side(raw_this_side: str, raw_type: str, this_language: str) -> DictionaryWord:
    return DictionaryWord(
        text=_clean(raw_this_side),
        word_type=_word_type_of(raw_type),
        article=_article_for(this_language, raw_this_side),
    )


def _build_side_indexes(
    text: str, swap: bool, source: str, target: str,
) -> tuple[list[tuple[str, DictionaryWord]], list[tuple[str, DictionaryWord]]]:
    """Every dict.cc line, indexed separately by its source-language text and by its
    target-language text (each paired with that side's own word_type/article) -- unlike
    `_parse_lines` (keyed by exact headword, for translating one known word), this is
    built for prefix search: same-language autocomplete over everything dict.cc has for
    that language, independent of any translation."""
    source_entries: list[tuple[str, DictionaryWord]] = []
    target_entries: list[tuple[str, DictionaryWord]] = []
    for line in text.splitlines():
        if line.startswith("#"):
            continue
        fields = line.split("\t")
        if len(fields) < 2:
            continue
        headword_raw, translation_raw = (fields[1], fields[0]) if swap else (fields[0], fields[1])
        raw_type = fields[2] if len(fields) > 2 else ""
        source_word = _word_for_side(headword_raw, raw_type, source)
        target_word = _word_for_side(translation_raw, raw_type, target)
        if source_word.text:
            source_entries.append((source_word.text.lower(), source_word))
        if target_word.text:
            target_entries.append((target_word.text.lower(), target_word))
    return source_entries, target_entries


def _load_side_indexes(source: str, target: str) -> tuple[list[tuple[str, DictionaryWord]], list[tuple[str, DictionaryWord]]]:
    cache_key = (str(DATA_DIR), source, target)
    if cache_key in _side_cache:
        return _side_cache[cache_key]
    located = _locate_archive(source, target)
    if located is None:
        result: tuple[list[tuple[str, DictionaryWord]], list[tuple[str, DictionaryWord]]] = ([], [])
    else:
        path, swapped = located
        result = _build_side_indexes(_read_archive_text(path), swapped, source, target)
    _side_cache[cache_key] = result
    return result


def search_words_by_prefix(source: str, target: str, language: str, prefix: str, limit: int = 20) -> list[DictionaryWord]:
    """Dictionary words whose own-language text starts with the typed prefix -- a
    same-language autocomplete (e.g. typing "Ja" in a French column suggests "jambe"),
    independent of any translation. `language` must be `source` or `target` (whichever
    this column's own language is); the archive for the (source, target) pair is reused
    either way, since it's the only one this project's lesson actually has. Ranked
    shortest-first, since among words sharing the typed prefix the shortest one is the
    closest to what was actually typed (and an exact match, zero letters longer, always
    comes first)."""
    normalized_prefix = prefix.strip().lower()
    if not normalized_prefix or language not in (source, target):
        return []
    source_entries, target_entries = _load_side_indexes(source, target)
    entries = source_entries if language == source else target_entries
    seen: set[tuple[str, Optional[str], Optional[str]]] = set()
    matches: list[DictionaryWord] = []
    for text_lower, word in entries:
        if not text_lower.startswith(normalized_prefix):
            continue
        key = (word.text, word.word_type, word.article)
        if key in seen:
            continue
        seen.add(key)
        matches.append(word)
    matches.sort(key=lambda w: (len(w.text), w.text.lower()))
    return matches[:limit]
