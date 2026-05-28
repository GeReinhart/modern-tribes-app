"""Add url_param_id to tribes, projects, users, projects_documents, publications

Revision ID: 010
Revises: 009
Create Date: 2026-05-23
"""
from alembic import op

revision = '010'
down_revision = '009'
branch_labels = None
depends_on = None


def _add_url_param_id_to_table(table: str) -> None:
    op.execute(f"ALTER TABLE {table} ADD COLUMN url_param_id VARCHAR(6)")
    op.execute(f"""
        DO $$
        DECLARE
            chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            r RECORD;
            new_id TEXT;
            attempts INT;
        BEGIN
            FOR r IN SELECT id FROM {table} LOOP
                attempts := 0;
                LOOP
                    new_id := '';
                    FOR i IN 1..6 LOOP
                        new_id := new_id || substr(chars, floor(random() * 62)::INT + 1, 1);
                    END LOOP;
                    IF NOT EXISTS (SELECT 1 FROM {table} WHERE url_param_id = new_id) THEN
                        UPDATE {table} SET url_param_id = new_id WHERE id = r.id;
                        EXIT;
                    END IF;
                    attempts := attempts + 1;
                    IF attempts > 1000 THEN
                        RAISE EXCEPTION 'Could not generate unique url_param_id for table {table}';
                    END IF;
                END LOOP;
            END LOOP;
        END $$
    """)
    op.execute(f"ALTER TABLE {table} ALTER COLUMN url_param_id SET NOT NULL")
    op.execute(f"ALTER TABLE {table} ADD CONSTRAINT {table}_url_param_id_unique UNIQUE (url_param_id)")
    op.execute(f"CREATE INDEX idx_{table}_url_param_id ON {table} (url_param_id)")


def _drop_url_param_id_from_table(table: str) -> None:
    op.execute(f"DROP INDEX IF EXISTS idx_{table}_url_param_id")
    op.execute(f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {table}_url_param_id_unique")
    op.execute(f"ALTER TABLE {table} DROP COLUMN IF EXISTS url_param_id")


def upgrade() -> None:
    for table in ('users', 'tribes', 'projects', 'projects_documents', 'publications'):
        _add_url_param_id_to_table(table)


def downgrade() -> None:
    for table in ('users', 'tribes', 'projects', 'projects_documents', 'publications'):
        _drop_url_param_id_from_table(table)
