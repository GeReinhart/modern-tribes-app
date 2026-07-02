"""Add icon to projects_features, relax name to optional

Revision ID: 009
Revises: 008
Create Date: 2026-07-02
"""
from alembic import op

revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE projects_features ADD COLUMN IF NOT EXISTS icon VARCHAR(50) NULL")
    op.execute("ALTER TABLE projects_features ALTER COLUMN name DROP NOT NULL")
    op.execute("""
        ALTER TABLE projects_features ADD CONSTRAINT chk_projects_features_name_or_icon
        CHECK ((name IS NOT NULL AND name <> '') OR icon IS NOT NULL)
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE projects_features DROP CONSTRAINT IF EXISTS chk_projects_features_name_or_icon")
    op.execute("ALTER TABLE projects_features ALTER COLUMN name SET NOT NULL")
    op.execute("ALTER TABLE projects_features DROP COLUMN IF EXISTS icon")
