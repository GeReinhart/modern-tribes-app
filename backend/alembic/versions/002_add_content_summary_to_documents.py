"""Add content_summary to documents

Revision ID: 002
Revises: 001
Create Date: 2026-05-11

"""
from alembic import op

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE documents ADD COLUMN content_summary TEXT")

    op.execute("""
        UPDATE documents
        SET content_summary = (
            CASE
                WHEN content_html ~ '<h[1-6][^>]*>(.+?)</h[1-6]>'
                THEN trim(regexp_replace(
                    (regexp_match(content_html, '<h[1-6][^>]*>(.+?)</h[1-6]>'))[1],
                    '<[^>]+>', '', 'g'
                ))
                ELSE (
                    CASE
                        WHEN length(trim(regexp_replace(content_html, '<[^>]+>', '', 'g'))) > 30
                        THEN left(trim(regexp_replace(content_html, '<[^>]+>', '', 'g')), 30) || '...'
                        ELSE trim(regexp_replace(content_html, '<[^>]+>', '', 'g'))
                    END
                )
            END
        )
        WHERE content_html IS NOT NULL
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE documents DROP COLUMN content_summary")
