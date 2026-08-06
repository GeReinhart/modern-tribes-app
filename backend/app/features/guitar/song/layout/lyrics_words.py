"""Pure, DB-free tokenization of a 'sections' block's lyrics text into its lyrics_words JSONB
shape, carrying chord attachments across an edit. No DB access here -- see block_content_service
for how this plugs into a block update."""
import difflib
import re

_WHITESPACE_RUN_RE = re.compile(r'( +)')
_EMPTY_SLOT_MIN_SPACES = 3


def tokenize_lyrics(text: str) -> list[tuple[int, int, str]]:
    """Split lyrics text into (line_index, word_index, word) tokens.

    A run of 3+ consecutive spaces (including leading/trailing) is treated as an
    intentional empty slot -- a place with no lyric where a chord can still be hung,
    e.g. for a strum between two words or after the last word of a line."""
    tokens = []
    for line_index, line in enumerate(text.split("\n")):
        word_index = 0
        for piece in _WHITESPACE_RUN_RE.split(line):
            if piece == "":
                continue
            if piece.isspace():
                if len(piece) >= _EMPTY_SLOT_MIN_SPACES:
                    tokens.append((line_index, word_index, ""))
                    word_index += 1
                continue
            tokens.append((line_index, word_index, piece))
            word_index += 1
    return tokens


def _flatten_words(nested_words: list[list[dict]] | None) -> list[dict]:
    """Flattens the nested [[{"text": ..., "chords": {...}}, ...], ...] lyrics_words shape into a
    flat, reading-order list, for diffing against a fresh tokenization."""
    if not nested_words:
        return []
    return [word for line in nested_words for word in line]


def match_carried_chords(
    old_words: list[dict], new_tokens: list[tuple[int, int, str]]
) -> dict[int, dict[str, str]]:
    """Diff the old (flattened) word list against freshly tokenized text and decide, for each new
    token index, which chords (by position) should carry over. A word only keeps its chords if
    the diff considers it unchanged relative to its neighbours -- an edited or removed word loses
    its chords instead of silently drifting onto the wrong word."""
    matcher = difflib.SequenceMatcher(
        a=[w["text"] for w in old_words], b=[token[2] for token in new_tokens], autojunk=False,
    )
    carried: dict[int, dict[str, str]] = {}
    for tag, i1, i2, j1, _j2 in matcher.get_opcodes():
        if tag != "equal":
            continue
        for offset in range(i2 - i1):
            old_word = old_words[i1 + offset]
            if old_word.get("chords"):
                carried[j1 + offset] = dict(old_word["chords"])
    return carried


def chord_ids_in_lyrics_words(words: list[list[dict]] | None) -> set[str]:
    """Every chord id attached anywhere in a lyrics_words structure, e.g. to link them all into
    a song's chord list, or to bulk-resolve them for a response."""
    return {chord_id for line in (words or []) for word in line for chord_id in word.get("chords", {}).values()}


def rebuild_words(text: str, old_words: list[list[dict]] | None) -> list[list[dict]]:
    """Re-tokenize `text` into the nested lyrics_words shape (a list of lines, each a list of
    words), carrying over the chord attachments of any word the diff considers unchanged relative
    to its neighbours. Always re-derived this way -- on a plain row replace the client resends its
    last-known lyrics_text/lyrics_words unchanged, so this reconciles against itself and is a
    no-op; on an actual lyrics edit, it's exactly the diff that carries chords across the edit.

    A line with no tokens at all (a blank line) is omitted entirely, matching the pre-existing
    behavior of grouping words by line_index -- blank lines were never a rendered, empty line."""
    flat_old = _flatten_words(old_words)
    new_tokens = tokenize_lyrics(text)
    carried = match_carried_chords(flat_old, new_tokens)
    lines: dict[int, list[dict]] = {}
    for index, (line_index, _word_index, word_text) in enumerate(new_tokens):
        lines.setdefault(line_index, []).append({"text": word_text, "chords": carried.get(index, {})})
    return [lines[key] for key in sorted(lines.keys())]
