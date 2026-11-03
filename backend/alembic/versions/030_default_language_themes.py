"""Give each seeded language a default theme (French blue, German autumn, English pink), so
words are colored by language out of the box. Only languages with no theme yet are touched, so a
theme already chosen by a user is kept.

Revision ID: 030
Revises: 029
Create Date: 2026-11-03
"""
from alembic import op

revision = '030'
down_revision = '029'
branch_labels = None
depends_on = None

_DEFAULT_THEMES = {'fr': 'main_2', 'de': 'alt_05', 'en': 'alt_07'}


def upgrade() -> None:
    for code, theme_code in _DEFAULT_THEMES.items():
        op.execute(
            f"UPDATE languages SET theme_code = '{theme_code}' WHERE code = '{code}' AND theme_code IS NULL"
        )


def downgrade() -> None:
    for code, theme_code in _DEFAULT_THEMES.items():
        op.execute(f"UPDATE languages SET theme_code = NULL WHERE code = '{code}' AND theme_code = '{theme_code}'")
