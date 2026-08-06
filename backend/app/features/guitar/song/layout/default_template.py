"""The row/column shape every new song is seeded with. Plain data, no DB/async
dependencies, so it can be imported both by the layout service and by the dev
database seed script (backend/scripts/init_db.py)."""

# A sensible starting width (out of 8) per element, matching the same defaults used when
# adding an element from the song's own page, so a fresh block never starts by claiming the
# whole row unless that's genuinely its natural size.
DEFAULT_BLOCK_WIDTH_EIGHTHS = {
    "title": 3,
    "author": 3,
    "tempo": 2,
    "time_signature": 1,
    "capo": 1,
    "description": 6,
    "chords": 6,
    "sections": 8,
    "videos": 4,
    "labels": 4,
}

DEFAULT_LAYOUT_ROWS = [
    {
        "page_break_before": False,
        "columns": [
            {"block_types": ["title"], "width_eighths": 8, "align": "left"},
        ],
    },
    {
        "page_break_before": False,
        "columns": [
            {"block_types": ["author"], "width_eighths": 2, "align": "left"},
            {"block_types": ["tempo", "time_signature", "capo"], "width_eighths": 6, "align": "left"},
        ],
    },
    {
        "page_break_before": False,
        "columns": [
            {"block_types": ["description"], "width_eighths": 8, "align": "left"},
        ],
    },
    {
        "page_break_before": False,
        "columns": [
            {"block_types": ["chords"], "width_eighths": 8, "align": "left"},
        ],
    },
    {
        "page_break_before": False,
        "columns": [
            {"block_types": ["sections"], "width_eighths": 8, "align": "left"},
        ],
    },
    {
        "page_break_before": False,
        "columns": [
            {"block_types": ["videos"], "width_eighths": 8, "align": "left"},
        ],
    },
]
