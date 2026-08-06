"""The row/column shape every new song is seeded with. Plain data, no DB/async
dependencies, so it can be imported both by the layout service and by the dev
database seed script (backend/scripts/init_db.py)."""

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
