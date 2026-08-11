"""The row/column shape every new song is seeded with. Plain data, no DB/async
dependencies, so it can be imported both by the layout service and by the dev
database seed script (backend/scripts/init_db.py)."""

# A sensible starting width (out of 12) per element, matching the same defaults used when
# adding an element from the song's own page, so a fresh block never starts by claiming the
# whole row unless that's genuinely its natural size.
DEFAULT_BLOCK_WIDTH_TWELFTHS = {
    "title": 4,
    "author": 4,
    "tempo": 3,
    "time_signature": 2,
    "capo": 2,
    "description": 9,
    "chords": 9,
    "sections": 12,
    "labels": 6,
}

DEFAULT_LAYOUT_ROWS = [
    {
        "page_break_before": False,
        "columns": [
            {"block_types": ["title"], "width_twelfths": 12, "align": "left"},
        ],
    },
    {
        "page_break_before": False,
        "columns": [
            {"block_types": ["author"], "width_twelfths": 3, "align": "left"},
            {"block_types": ["tempo", "time_signature", "capo"], "width_twelfths": 9, "align": "left"},
        ],
    },
    {
        "page_break_before": False,
        "columns": [
            {"block_types": ["description"], "width_twelfths": 12, "align": "left"},
        ],
    },
    {
        "page_break_before": False,
        "columns": [
            {"block_types": ["chords"], "width_twelfths": 12, "align": "left"},
        ],
    },
    {
        "page_break_before": False,
        "columns": [
            {"block_types": ["sections"], "width_twelfths": 12, "align": "left"},
        ],
    },
]
