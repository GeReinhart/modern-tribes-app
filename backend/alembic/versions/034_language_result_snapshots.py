"""Precomputed daily results of a person on a language lesson.

One row per lesson, person and day: the lesson's overall score at the end of that day and the
day's weighted successes and errors. Past days never change, so the results pages read these
rows instead of recomputing the whole history on each request.

Revision ID: 034
Revises: 033
Create Date: 2026-11-13
"""
from alembic import op

revision = '034'
down_revision = '033'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE language_result_snapshots (
            lesson_id UUID REFERENCES language_lessons(id) ON DELETE CASCADE NOT NULL,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            day DATE NOT NULL,
            score DOUBLE PRECISION NOT NULL,
            success DOUBLE PRECISION NOT NULL,
            errors DOUBLE PRECISION NOT NULL,
            last_attempt_at TIMESTAMP WITH TIME ZONE,
            PRIMARY KEY (lesson_id, user_id, day)
        )
    """)
    # Backfill: the rows are built lazily on the first read of each person's results.


def downgrade() -> None:
    op.execute("DROP TABLE language_result_snapshots")
