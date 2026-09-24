"""Add PDF content mode to guitar songs.

Revision ID: 024
Revises: 023
Create Date: 2026-09-24
"""
from alembic import op

revision = '024'
down_revision = '023'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs ADD COLUMN content_type VARCHAR(20) NOT NULL DEFAULT 'layout' "
        "CHECK (content_type IN ('layout', 'pdf'))"
    )
    op.execute("ALTER TABLE guitar_songs ADD COLUMN pdf_file_url TEXT NULL")
    op.execute("ALTER TABLE guitar_songs ADD COLUMN pdf_file_name VARCHAR(255) NULL")
    op.execute("ALTER TABLE guitar_songs ADD COLUMN pdf_file_size INTEGER NULL")


def downgrade() -> None:
    op.execute("ALTER TABLE guitar_songs DROP COLUMN pdf_file_size")
    op.execute("ALTER TABLE guitar_songs DROP COLUMN pdf_file_name")
    op.execute("ALTER TABLE guitar_songs DROP COLUMN pdf_file_url")
    op.execute("ALTER TABLE guitar_songs DROP COLUMN content_type")
