"""Allow one user to represent multiple persons

Revision ID: 007
Revises: 006
Create Date: 2026-05-16
"""

from alembic import op

revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE represents DROP CONSTRAINT IF EXISTS represents_user_id_key")


def downgrade():
    op.execute("ALTER TABLE represents ADD CONSTRAINT represents_user_id_key UNIQUE (user_id)")
