"""Add padding to a layout block itself, the same 4 fields (padding_top_mm/right_mm/bottom_mm/
left_mm) a column already has -- a block can now be given its own margin inside its column,
independent of the column's own padding around all of its blocks.

Revision ID: 026
Revises: 025
Create Date: 2026-08-10
"""
from alembic import op

revision = '026'
down_revision = '025'
branch_labels = None
depends_on = None

_TABLE = "guitar_songs_layout_column_blocks"


def upgrade() -> None:
    op.execute(f"""
        ALTER TABLE {_TABLE}
            ADD COLUMN IF NOT EXISTS padding_top_mm NUMERIC(5,1) NOT NULL DEFAULT 0
                CHECK (padding_top_mm BETWEEN 0 AND 100),
            ADD COLUMN IF NOT EXISTS padding_right_mm NUMERIC(5,1) NOT NULL DEFAULT 0
                CHECK (padding_right_mm BETWEEN 0 AND 100),
            ADD COLUMN IF NOT EXISTS padding_bottom_mm NUMERIC(5,1) NOT NULL DEFAULT 0
                CHECK (padding_bottom_mm BETWEEN 0 AND 100),
            ADD COLUMN IF NOT EXISTS padding_left_mm NUMERIC(5,1) NOT NULL DEFAULT 0
                CHECK (padding_left_mm BETWEEN 0 AND 100)
    """)


def downgrade() -> None:
    op.execute(f"""
        ALTER TABLE {_TABLE}
            DROP COLUMN IF EXISTS padding_top_mm,
            DROP COLUMN IF EXISTS padding_right_mm,
            DROP COLUMN IF EXISTS padding_bottom_mm,
            DROP COLUMN IF EXISTS padding_left_mm
    """)
