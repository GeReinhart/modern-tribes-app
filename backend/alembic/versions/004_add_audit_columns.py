"""Add created_by and updated_by audit columns to entity tables

Revision ID: 004
Revises: 003
Create Date: 2026-05-15

"""
from alembic import op

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None

TABLES = ['permissions', 'roles', 'documents', 'persons', 'users', 'projects', 'tribes', 'positions', 'labels']


def upgrade() -> None:
    for table in TABLES:
        op.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL")
        op.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL")


def downgrade() -> None:
    for table in reversed(TABLES):
        op.execute(f"ALTER TABLE {table} DROP COLUMN IF EXISTS updated_by")
        op.execute(f"ALTER TABLE {table} DROP COLUMN IF EXISTS created_by")
