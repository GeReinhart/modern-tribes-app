"""Footer spacing: how far the printed footer (title/author + page number) sits from the page's
true bottom edge, independent of margin_bottom_mm (the content's own clearance above it) -- see
pdf_service._footer_css. Defaults to 5.0mm, comfortably inside the default 15.0mm bottom margin.

Revision ID: 035
Revises: 034
Create Date: 2026-08-12
"""
from alembic import op

revision = '035'
down_revision = '034'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE guitar_songs_layout_settings ADD COLUMN footer_spacing_mm NUMERIC(5,1) NOT NULL DEFAULT 5.0 "
        "CHECK (footer_spacing_mm BETWEEN 0 AND 100)"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE guitar_songs_layout_settings DROP COLUMN footer_spacing_mm")
