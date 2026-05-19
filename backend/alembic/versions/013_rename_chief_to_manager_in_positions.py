"""Rename position value 'chief' to 'manager' in positions table

Revision ID: 013
Revises: 012
Create Date: 2026-05-19
"""
from alembic import op

revision = '013'
down_revision = '012'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_position_check")
    op.execute("UPDATE positions SET position = 'manager' WHERE position = 'chief'")
    op.execute("ALTER TABLE positions ADD CONSTRAINT positions_position_check CHECK (position IN ('manager', 'member', 'guest'))")


def downgrade():
    op.execute("ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_position_check")
    op.execute("UPDATE positions SET position = 'chief' WHERE position = 'manager'")
    op.execute("ALTER TABLE positions ADD CONSTRAINT positions_position_check CHECK (position IN ('chief', 'member', 'guest'))")
