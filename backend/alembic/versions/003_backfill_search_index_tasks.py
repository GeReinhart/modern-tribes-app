"""Backfill search_index for existing todo_items and kanban_cards

Revision ID: 003
Revises: 002
Create Date: 2026-06-11
"""
from alembic import op

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO search_index (
            entity_type, entity_id, content_text, content_summary,
            routing_path, status, created_at, updated_at, created_by, updated_by
        )
        SELECT
            'todo_item',
            ti.id,
            TRIM(CONCAT_WS(' ',
                ti.title,
                (SELECT string_agg(l.name, ' ' ORDER BY l.name)
                 FROM label_entities le
                 JOIN labels l ON l.id = le.label_id
                 WHERE le.entity_id = ti.id
                   AND le.entity_type = 'todo_item'
                   AND l.status = 'active'),
                d.content_text
            )),
            ti.title,
            '/app/tribes/' || t.url_param_id
                || '/projects/' || p.url_param_id
                || '/' || pf.id::text
                || '?taskId=' || ti.id::text,
            'active',
            NOW(),
            NOW(),
            NULL,
            NULL
        FROM todo_items ti
        JOIN projects_features pf ON pf.id = ti.feature_instance_id AND pf.status = 'active'
        JOIN projects p ON p.id = pf.project_id AND p.status = 'active'
        JOIN tribes_projects tp ON tp.project_id = p.id
        JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
        LEFT JOIN documents d ON d.id = ti.document_id AND d.status = 'active'
        WHERE ti.status != 'archived'
        ON CONFLICT (entity_type, entity_id) DO NOTHING
    """)

    op.execute("""
        INSERT INTO search_index (
            entity_type, entity_id, content_text, content_summary,
            routing_path, status, created_at, updated_at, created_by, updated_by
        )
        SELECT
            'kanban_card',
            kc.id,
            TRIM(CONCAT_WS(' ',
                kc.title,
                (SELECT string_agg(l.name, ' ' ORDER BY l.name)
                 FROM label_entities le
                 JOIN labels l ON l.id = le.label_id
                 WHERE le.entity_id = kc.id
                   AND le.entity_type = 'kanban_card'
                   AND l.status = 'active'),
                d.content_text
            )),
            kc.title,
            '/app/tribes/' || t.url_param_id
                || '/projects/' || p.url_param_id
                || '/' || pf.id::text
                || '?taskId=' || kc.id::text,
            'active',
            NOW(),
            NOW(),
            NULL,
            NULL
        FROM kanban_cards kc
        JOIN projects_features pf ON pf.id = kc.feature_instance_id AND pf.status = 'active'
        JOIN projects p ON p.id = pf.project_id AND p.status = 'active'
        JOIN tribes_projects tp ON tp.project_id = p.id
        JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
        LEFT JOIN documents d ON d.id = kc.document_id AND d.status = 'active'
        WHERE kc.status != 'archived'
        ON CONFLICT (entity_type, entity_id) DO NOTHING
    """)


def downgrade() -> None:
    op.execute("""
        DELETE FROM search_index
        WHERE entity_type IN ('todo_item', 'kanban_card')
    """)
