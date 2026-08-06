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


def match_carried_chords(
    old_words: list[dict], new_tokens: list[tuple[int, int, str]]
) -> dict[int, dict[str, str]]:
    """Diff the old word list against freshly tokenized text and decide, for each new
    token index, which chords (by position) should carry over. A word only keeps its
    chords if the diff considers it unchanged relative to its neighbours -- an edited
    or removed word loses its chords instead of silently drifting onto the wrong word."""
    matcher = difflib.SequenceMatcher(
        a=[w["text"] for w in old_words], b=[token[2] for token in new_tokens], autojunk=False,
    )
    carried: dict[int, dict[str, str]] = {}
    for tag, i1, i2, j1, _j2 in matcher.get_opcodes():
        if tag != "equal":
            continue
        for offset in range(i2 - i1):
            old_word = old_words[i1 + offset]
            if old_word["chords"]:
                carried[j1 + offset] = {pos: chord["id"] for pos, chord in old_word["chords"].items()}
    return carried
