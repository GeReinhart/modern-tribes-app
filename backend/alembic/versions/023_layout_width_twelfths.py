"""Rename width_eighths to width_twelfths on guitar_songs_layout_columns and
guitar_songs_layout_column_blocks, widening the row-width scale from eighths (1-8) to twelfths
(1-12) -- twelfths split cleanly into halves, thirds AND quarters, which eighths could not.
Existing widths are left as-is (a value of 8 still means "full row"), since the scale's upper
bound simply moved from 8 to 12; nothing needs rescaling.

Revision ID: 023
Revises: 022
Create Date: 2026-08-10
"""
from alembic import op

revision = '023'
down_revision = '022'
branch_labels = None
depends_on = None

_TABLES = ("guitar_songs_layout_columns", "guitar_songs_layout_column_blocks")


def _drop_check_constraint_on(table: str, column: str) -> str:
    """CHECK constraints declared inline in CREATE TABLE get an auto-generated name, so this
    looks the constraint up by its definition instead of guessing the name."""
    return f"""
    DO $$
    DECLARE
        con_name text;
    BEGIN
        SELECT conname INTO con_name
        FROM pg_constraint
        WHERE conrelid = '{table}'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%{column}%';
        IF con_name IS NOT NULL THEN
            EXECUTE format('ALTER TABLE {table} DROP CONSTRAINT %I', con_name);
        END IF;
    END $$;
    """


def upgrade() -> None:
    for table in _TABLES:
        op.execute(_drop_check_constraint_on(table, "width_eighths"))
        op.execute(f"ALTER TABLE {table} RENAME COLUMN width_eighths TO width_twelfths")
        op.execute(
            f"ALTER TABLE {table} ADD CONSTRAINT {table}_width_twelfths_check "
            "CHECK (width_twelfths BETWEEN 1 AND 12)"
        )
    op.execute("ALTER TABLE guitar_songs_layout_column_blocks ALTER COLUMN width_twelfths SET DEFAULT 12")


def downgrade() -> None:
    op.execute("ALTER TABLE guitar_songs_layout_column_blocks ALTER COLUMN width_twelfths SET DEFAULT 8")
    for table in _TABLES:
        op.execute(_drop_check_constraint_on(table, "width_twelfths"))
        op.execute(f"ALTER TABLE {table} RENAME COLUMN width_twelfths TO width_eighths")
        op.execute(
            f"ALTER TABLE {table} ADD CONSTRAINT {table}_width_eighths_check "
            "CHECK (width_eighths BETWEEN 1 AND 8)"
        )
