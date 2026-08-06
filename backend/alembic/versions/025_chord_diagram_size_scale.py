"""Replace the 4-level chord diagram size scale (very_small/small/medium/large) with a finer,
overall smaller 7-level one (xxs/xs/s/m/l/xl/xxl) -- the old "medium" default read as too large
in practice, and there was no room between "small" and "medium" to just tone it down without
losing "small" itself.

This is a clean-slate change (still in development, no data migration needed) -- existing rows
are remapped to a reasonable same-ballpark new value rather than preserved exactly, since the
whole scale is shifting smaller anyway.

Revision ID: 025
Revises: 024
Create Date: 2026-08-10
"""
from alembic import op

revision = '025'
down_revision = '024'
branch_labels = None
depends_on = None

_TABLE = "guitar_songs"
_CONSTRAINT = "guitar_songs_chord_diagram_size_check"
_OLD_SIZES = "'very_small', 'small', 'medium', 'large'"
_NEW_SIZES = "'xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl'"
_OLD_TO_NEW = {"very_small": "xxs", "small": "xs", "medium": "m", "large": "l"}
_NEW_TO_OLD = {new: old for old, new in _OLD_TO_NEW.items()}


def upgrade() -> None:
    op.execute(f"ALTER TABLE {_TABLE} DROP CONSTRAINT IF EXISTS {_CONSTRAINT}")
    for old, new in _OLD_TO_NEW.items():
        op.execute(f"UPDATE {_TABLE} SET chord_diagram_size = '{new}' WHERE chord_diagram_size = '{old}'")
    op.execute(f"ALTER TABLE {_TABLE} ALTER COLUMN chord_diagram_size SET DEFAULT 'm'")
    op.execute(f"ALTER TABLE {_TABLE} ADD CONSTRAINT {_CONSTRAINT} CHECK (chord_diagram_size IN ({_NEW_SIZES}))")


def downgrade() -> None:
    op.execute(f"ALTER TABLE {_TABLE} DROP CONSTRAINT IF EXISTS {_CONSTRAINT}")
    for new, old in _NEW_TO_OLD.items():
        op.execute(f"UPDATE {_TABLE} SET chord_diagram_size = '{old}' WHERE chord_diagram_size = '{new}'")
    op.execute(f"UPDATE {_TABLE} SET chord_diagram_size = 'medium' WHERE chord_diagram_size NOT IN ({_OLD_SIZES})")
    op.execute(f"ALTER TABLE {_TABLE} ALTER COLUMN chord_diagram_size SET DEFAULT 'medium'")
    op.execute(f"ALTER TABLE {_TABLE} ADD CONSTRAINT {_CONSTRAINT} CHECK (chord_diagram_size IN ({_OLD_SIZES}))")
