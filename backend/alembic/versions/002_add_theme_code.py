"""Add theme_code to projects, tribes, projects_features

Revision ID: 002
Revises: 001
Create Date: 2026-06-03
"""
from alembic import op

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS theme_code VARCHAR(50) NULL")
    op.execute("ALTER TABLE tribes ADD COLUMN IF NOT EXISTS theme_code VARCHAR(50) NULL")
    op.execute("ALTER TABLE projects_features ADD COLUMN IF NOT EXISTS theme_code VARCHAR(50) NULL")


def downgrade() -> None:
    op.execute("ALTER TABLE projects DROP COLUMN IF EXISTS theme_code")
    op.execute("ALTER TABLE tribes DROP COLUMN IF EXISTS theme_code")
    op.execute("ALTER TABLE projects_features DROP COLUMN IF EXISTS theme_code")
