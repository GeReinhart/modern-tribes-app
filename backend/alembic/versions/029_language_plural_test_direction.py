"""Allow the 'plural' direction on language test attempts: the test of a noun's plural
(typed freely) is recorded as an attempt like the translation and article tests.

Revision ID: 029
Revises: 028
Create Date: 2026-11-03
"""
from alembic import op

revision = '029'
down_revision = '028'
branch_labels = None
depends_on = None

_CONSTRAINT = "language_word_test_attempts_direction_check"


def upgrade() -> None:
    op.execute(f"ALTER TABLE language_word_test_attempts DROP CONSTRAINT IF EXISTS {_CONSTRAINT}")
    op.execute(
        f"ALTER TABLE language_word_test_attempts ADD CONSTRAINT {_CONSTRAINT} "
        "CHECK (direction IN ('source_to_target', 'target_to_source', 'article', 'plural'))"
    )


def downgrade() -> None:
    op.execute("DELETE FROM language_word_test_attempts WHERE direction = 'plural'")
    op.execute(f"ALTER TABLE language_word_test_attempts DROP CONSTRAINT IF EXISTS {_CONSTRAINT}")
    op.execute(
        f"ALTER TABLE language_word_test_attempts ADD CONSTRAINT {_CONSTRAINT} "
        "CHECK (direction IN ('source_to_target', 'target_to_source', 'article'))"
    )
