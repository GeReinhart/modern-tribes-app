"""Allow multiple users to represent the same person

Revision ID: 012
Revises: 011
Create Date: 2026-05-19
"""
from alembic import op

revision = '012'
down_revision = '011'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("ALTER TABLE represents DROP CONSTRAINT IF EXISTS represents_person_id_key")
    op.execute("ALTER TABLE represents ADD CONSTRAINT represents_user_id_person_id_key UNIQUE (user_id, person_id)")


def downgrade():
    op.execute("ALTER TABLE represents DROP CONSTRAINT IF EXISTS represents_user_id_person_id_key")
    op.execute("ALTER TABLE represents ADD CONSTRAINT represents_person_id_key UNIQUE (person_id)")
