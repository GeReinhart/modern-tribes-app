"""add language to users

Revision ID: 010
Revises: 009
Create Date: 2026-05-18
"""
from alembic import op
import sqlalchemy as sa

revision = '010'
down_revision = '009'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('language', sa.String(10), nullable=False, server_default='en'))


def downgrade():
    op.drop_column('users', 'language')
