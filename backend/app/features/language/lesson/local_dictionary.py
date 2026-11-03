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

Memory: one archive serves both directions and both languages, so it is indexed ONCE (never
per direction). The index keeps only the raw entry lines plus, per column, the cleaned
lower-cased texts in sorted order with the line each comes from. Lookups bisect those texts and
parse just the few matching lines, instead of holding a parsed object for every entry.

Never raises: a missing archive for a pair, or a word with no match, both simply mean "no
suggestions", since the translation can always be typed in by hand instead.
"""
import html
import re
import threading
import zipfile
from array import array
from bisect import bisect_left, bisect_right
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
    """The archive covering a language pair, and whether `source` is its second column.
    dict.cc ships each pair twice (de.fr and fr.de), mirrors of one another: the archive named
    in alphabetical order is always preferred, so both directions share one archive -- and
    therefore one in-memory index -- instead of loading each pair twice."""
    first, second = sorted((source.lower(), target.lower()))
    for owner, other in ((first, second), (second, first)):
        archive = DATA_DIR / f"dict.{owner}.{other}.zip"
        if archive.is_file():
            return archive, source.lower() != owner
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



class _Index(NamedTuple):
    lines: list[str]
    # Per column (0 = first, 1 = second): cleaned lower-cased texts sorted, and the line of each.
    keys: tuple[list[str], list[str]]
    line_of: tuple[array, array]


_indexes: dict[tuple[str, str], _Index] = {}
_load_lock = threading.Lock()


def _build_index(text: str) -> _Index:
    lines = [line for line in text.splitlines() if "\t" in line and not line.startswith("#")]
    keys: list[list[str]] = []
    line_of: list[array] = []
    for column in (0, 1):
        cleaned = [_clean(line.split("\t")[column]).lower() for line in lines]
        order = sorted((i for i, key in enumerate(cleaned) if key), key=cleaned.__getitem__)
        keys.append([cleaned[i] for i in order])
        line_of.append(array("I", order))
    return _Index(lines, (keys[0], keys[1]), (line_of[0], line_of[1]))


def _index_for(source: str, target: str) -> tuple[_Index, bool] | None:
    """The shared index of the archive covering this pair, and whether `source` is its
    second column. Keyed by archive, so fr->de and de->fr reuse the same index."""
    located = _locate_archive(source, target)
    if located is None:
        return None
    path, swapped = located
    cache_key = (str(DATA_DIR), path.name)
    with _load_lock:
        if cache_key not in _indexes:
            _indexes[cache_key] = _build_index(_read_archive_text(path))
    return _indexes[cache_key], swapped


def _fields_of(index: _Index, column: int, position: int) -> list[str]:
    return index.lines[index.line_of[column][position]].split("\t")


def _raw_type(fields: list[str]) -> str:
    return fields[2] if len(fields) > 2 else ""


def suggest_translations(source: str, target: str, text: str) -> list[DictionaryCandidate]:
    found = _index_for(source, target)
    if found is None:
        return []
    index, swapped = found
    column = 1 if swapped else 0
    key = text.strip().lower()
    keys = index.keys[column]
    candidates: list[DictionaryCandidate] = []
    for position in range(bisect_left(keys, key), bisect_right(keys, key)):
        fields = _fields_of(index, column, position)
        candidate = _candidate_from_line(
            fields[column], fields[1 - column], _raw_type(fields), source, target,
        )
        if candidate not in candidates:
            candidates.append(candidate)
        if len(candidates) >= _MAX_CANDIDATES:
            break
    return candidates


def _word_for_side(raw_this_side: str, raw_type: str, this_language: str) -> DictionaryWord:
    return DictionaryWord(
        text=_clean(raw_this_side),
        word_type=_word_type_of(raw_type),
        article=_article_for(this_language, raw_this_side),
    )




def _prefix_positions(keys: list[str], prefix: str) -> list[int]:
    """Positions of the texts starting with `prefix`, shortest text first (then alphabetical)."""
    start = bisect_left(keys, prefix)
    end = bisect_left(keys, prefix + "\U0010ffff", start)
    return sorted(range(start, end), key=lambda p: (len(keys[p]), keys[p]))


def search_words_by_prefix(source: str, target: str, language: str, prefix: str, limit: int = 20) -> list[DictionaryWord]:
    """Dictionary words whose own-language text starts with the typed prefix -- a
    same-language autocomplete (e.g. typing "Ja" in a French column suggests "jambe"),
    independent of any translation. `language` must be `source` or `target` (whichever
    this column's own language is); the archive for the (source, target) pair is reused
    either way. Ranked shortest-first, since among words sharing the typed prefix the
    shortest one is the closest to what was actually typed (an exact match always comes
    first). Only the lines of the words actually returned are parsed."""
    normalized_prefix = prefix.strip().lower()
    found = _index_for(source, target)
    if not normalized_prefix or language not in (source, target) or found is None:
        return []
    index, swapped = found
    column = (1 if swapped else 0) if language == source else (0 if swapped else 1)
    seen: set[tuple[str, Optional[str], Optional[str]]] = set()
    matches: list[DictionaryWord] = []
    for position in _prefix_positions(index.keys[column], normalized_prefix):
        fields = _fields_of(index, column, position)
        word = _word_for_side(fields[column], _raw_type(fields), language)
        key = (word.text, word.word_type, word.article)
        if key in seen:
            continue
        seen.add(key)
        matches.append(word)
        if len(matches) >= limit:
            break
    return matches
