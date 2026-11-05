"""Allow the word type 'other' (adverbs, prepositions, ...) in the language vocabulary.

Revision ID: 032
Revises: 031
Create Date: 2026-11-05
"""
from alembic import op

revision = '032'
down_revision = '031'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE language_words DROP CONSTRAINT language_words_word_type_check")
    op.execute(
        "ALTER TABLE language_words ADD CONSTRAINT language_words_word_type_check "
        "CHECK (word_type IN ('noun', 'adjective', 'verb', 'other'))"
    )


def downgrade() -> None:
    op.execute("DELETE FROM language_words WHERE word_type = 'other'")
    op.execute("ALTER TABLE language_words DROP CONSTRAINT language_words_word_type_check")
    op.execute(
        "ALTER TABLE language_words ADD CONSTRAINT language_words_word_type_check "
        "CHECK (word_type IN ('noun', 'adjective', 'verb'))"
    )
