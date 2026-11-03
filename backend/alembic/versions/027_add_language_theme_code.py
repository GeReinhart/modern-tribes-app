"""Let an admin assign a theme/color to each language, consistently reused everywhere a
word of that language is shown (mirrors the existing theme_code column on tribes,
projects and projects_features).

Revision ID: 027
Revises: 026
Create Date: 2026-11-02
"""
from alembic import op

revision = '027'
down_revision = '026'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE languages ADD COLUMN theme_code VARCHAR(50) NULL")


def downgrade() -> None:
    op.execute("ALTER TABLE languages DROP COLUMN theme_code")
