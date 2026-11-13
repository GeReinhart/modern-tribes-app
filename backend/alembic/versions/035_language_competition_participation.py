"""Whether a user takes part in a language project's competition.

One row per project and user, created the first time the user joins or leaves the competition.
Without a row the user takes part, so nothing needs backfilling.

Revision ID: 035
Revises: 034
Create Date: 2026-11-14
"""
from alembic import op

revision = '035'
down_revision = '034'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE language_competition_participation (
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            participates BOOLEAN NOT NULL,
            PRIMARY KEY (project_id, user_id)
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE language_competition_participation")
