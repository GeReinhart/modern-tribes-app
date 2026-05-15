"""Add status column to entity tables

Revision ID: 005
Revises: 004
Create Date: 2026-05-15
"""

from alembic import op

revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None

TABLES = ['permissions', 'roles', 'documents', 'persons', 'users', 'projects', 'tribes', 'positions', 'labels']


def upgrade():
    for table in TABLES:
        op.execute(
            f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS "
            f"status VARCHAR(20) NOT NULL DEFAULT 'active' "
            f"CHECK (status IN ('pending', 'active', 'archived'))"
        )


def downgrade():
    for table in reversed(TABLES):
        op.execute(f"ALTER TABLE {table} DROP COLUMN IF EXISTS status")
