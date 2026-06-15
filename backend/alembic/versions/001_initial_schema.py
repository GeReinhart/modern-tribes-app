"""Full consolidated schema

Revision ID: 001
Revises: None
Create Date: 2026-06-12
"""
from alembic import op

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql'
    """)

    # ── Authorization ────────────────────────────────────────────────────────

    op.execute("""
        CREATE TABLE permissions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID,
            updated_by UUID,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)

    op.execute("""
        CREATE TABLE roles (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID,
            updated_by UUID,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)

    op.execute("""
        CREATE TABLE role_permissions (
            role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
            permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
            PRIMARY KEY (role_id, permission_id)
        )
    """)

    # ── Documents ────────────────────────────────────────────────────────────

    op.execute("""
        CREATE TABLE documents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            content_html TEXT,
            content_summary TEXT,
            content_text TEXT,
            revisions JSONB NOT NULL DEFAULT '[]',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID,
            updated_by UUID,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)

    op.execute("""
        CREATE TABLE document_attachments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            file_id VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            size BIGINT NOT NULL,
            type VARCHAR(255) NOT NULL,
            url TEXT NOT NULL,
            uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ── People ───────────────────────────────────────────────────────────────

    op.execute("""
        CREATE TABLE persons (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            first_name VARCHAR(255) NOT NULL,
            last_name VARCHAR(255) NOT NULL,
            gender VARCHAR(50) NOT NULL CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID,
            updated_by UUID,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)

    op.execute("""
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            login VARCHAR(255) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
            language VARCHAR(10) NOT NULL DEFAULT 'en',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID,
            updated_by UUID,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)

    for table in ('permissions', 'roles', 'documents', 'persons', 'users'):
        op.execute(
            f"ALTER TABLE {table} ADD CONSTRAINT {table}_created_by_fkey "
            f"FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL"
        )
        op.execute(
            f"ALTER TABLE {table} ADD CONSTRAINT {table}_updated_by_fkey "
            f"FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL"
        )

    op.execute("""
        CREATE TABLE user_roles (
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, role_id)
        )
    """)

    op.execute("""
        CREATE TABLE user_sessions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            session_id VARCHAR(255) UNIQUE NOT NULL,
            user_agent TEXT,
            ip_address VARCHAR(45),
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            refresh_token_hash VARCHAR(255),
            refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    """)

    op.execute("""
        CREATE TABLE represents (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE (user_id, person_id)
        )
    """)

    op.execute("""
        CREATE TABLE user_tab_configs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            context_key VARCHAR(100) NOT NULL,
            tab_configs JSONB NOT NULL DEFAULT '[]',
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE(user_id, context_key)
        )
    """)

    op.execute("""
        CREATE TABLE user_bookmarks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            page_path VARCHAR(500) NOT NULL,
            page_title VARCHAR(200) NOT NULL,
            description TEXT,
            color_text VARCHAR(50),
            color_background VARCHAR(50),
            display_order INT NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE(user_id, page_path)
        )
    """)

    op.execute("""
        CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url_param_id VARCHAR(12) UNIQUE NOT NULL,
            target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message TEXT NOT NULL,
            sent_at TIMESTAMP WITH TIME ZONE NULL,
            notification_status VARCHAR(20) NOT NULL DEFAULT 'planned'
                CHECK (notification_status IN ('planned', 'sent', 'failed')),
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    # ── Mails ─────────────────────────────────────────────────────────────────

    op.execute("""
        CREATE TABLE mails (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            subject VARCHAR(500) NOT NULL,
            content_html TEXT NOT NULL,
            mail_type VARCHAR(50),
            mail_status VARCHAR(20) NOT NULL DEFAULT 'not_sent' CHECK (mail_status IN ('not_sent', 'sent')),
            planned_at TIMESTAMP WITH TIME ZONE NOT NULL,
            sent_at TIMESTAMP WITH TIME ZONE,
            status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    op.execute("""
        CREATE TABLE mails_to (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            mail_id UUID REFERENCES mails(id) ON DELETE CASCADE NOT NULL,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (mail_id, user_id)
        )
    """)

    # ── Tribes & Projects ─────────────────────────────────────────────────────

    op.execute("""
        CREATE TABLE projects (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT,
            theme_code VARCHAR(50) NULL,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)

    op.execute("""
        CREATE TABLE tribes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            name VARCHAR(255) UNIQUE NOT NULL,
            theme_code VARCHAR(50) NULL,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)

    op.execute("""
        CREATE TABLE tribes_projects (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE NOT NULL,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
            relation VARCHAR(20) NOT NULL CHECK (relation IN ('manager', 'member', 'guest')),
            display_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (tribe_id, project_id)
        )
    """)

    op.execute("""
        CREATE TABLE positions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE NOT NULL,
            person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
            position VARCHAR(50) NOT NULL CHECK (position IN ('manager', 'member', 'guest')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            UNIQUE (tribe_id, person_id)
        )
    """)

    # ── Features ──────────────────────────────────────────────────────────────

    op.execute("""
        CREATE TABLE projects_features (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
            feature_type VARCHAR(100) NOT NULL,
            name VARCHAR(255) NOT NULL,
            theme_code VARCHAR(50) NULL,
            status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
            position INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    op.execute("""
        CREATE TABLE todo_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            feature_instance_id UUID REFERENCES projects_features(id) ON DELETE CASCADE NOT NULL,
            title VARCHAR(500) NOT NULL,
            status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
            todo_status VARCHAR(50) NOT NULL DEFAULT 'todo' CHECK (todo_status IN ('todo', 'done')),
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            position INTEGER DEFAULT 0,
            size INTEGER,
            assigned_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
            due_date DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    op.execute("""
        CREATE TABLE kanban_columns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    op.execute("""
        CREATE TABLE kanban_cards (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
            column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
            parent_card_id UUID REFERENCES kanban_cards(id) ON DELETE CASCADE,
            title VARCHAR(500) NOT NULL,
            assigned_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
            document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
            position INTEGER NOT NULL DEFAULT 0,
            size INTEGER,
            due_date DATE,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    # ── Labels ────────────────────────────────────────────────────────────────

    op.execute("""
        CREATE TABLE labels (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            feature_instance_id UUID REFERENCES projects_features(id) ON DELETE CASCADE,
            color VARCHAR(20) NOT NULL DEFAULT '#6b7280',
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
        )
    """)

    op.execute("CREATE UNIQUE INDEX labels_name_global_unique ON labels (name) WHERE feature_instance_id IS NULL")
    op.execute("CREATE UNIQUE INDEX labels_name_feature_unique ON labels (name, feature_instance_id) WHERE feature_instance_id IS NOT NULL")

    op.execute("""
        CREATE TABLE label_entities (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            label_id UUID REFERENCES labels(id) ON DELETE CASCADE NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (label_id, entity_type, entity_id)
        )
    """)

    op.execute("""
        CREATE TABLE document_entities (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
            entity_type VARCHAR(100) NOT NULL,
            entity_id UUID NOT NULL,
            file_path VARCHAR(500),
            file_type VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (document_id, entity_type, entity_id)
        )
    """)

    # ── App Config ────────────────────────────────────────────────────────────

    op.execute("""
        CREATE TABLE app_config (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            key VARCHAR(255) UNIQUE NOT NULL,
            value TEXT NOT NULL DEFAULT '',
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    op.execute("""
        INSERT INTO app_config (key, value, description) VALUES
        ('upload.max_files', '5', 'Maximum number of files that can be attached to a document'),
        ('upload.max_file_size_mb', '10', 'Maximum file size in megabytes for attachments'),
        ('editor.image_extensions', 'jpg,png,jpeg,gif,webp', 'Allowed image extensions in the editor (comma-separated)')
    """)

    # ── Project Documents ─────────────────────────────────────────────────────

    op.execute("""
        CREATE TABLE projects_documents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            toc_depth INTEGER NOT NULL DEFAULT 4,
            status VARCHAR(50) NOT NULL DEFAULT 'active'
                CONSTRAINT projects_documents_status_check CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id),
            updated_by UUID REFERENCES users(id)
        )
    """)

    op.execute("""
        CREATE TABLE document_pages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            project_document_id UUID NOT NULL REFERENCES projects_documents(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            content_html TEXT NOT NULL DEFAULT '',
            content_summary TEXT,
            content_text TEXT,
            attachments JSONB NOT NULL DEFAULT '[]',
            revisions JSONB NOT NULL DEFAULT '[]',
            order_index INTEGER NOT NULL DEFAULT 0,
            status VARCHAR(50) NOT NULL DEFAULT 'active'
                CONSTRAINT document_pages_status_check CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    op.execute("""
        CREATE TABLE publications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            url_param_id VARCHAR(6) UNIQUE NOT NULL,
            document_id UUID NOT NULL UNIQUE REFERENCES documents(id) ON DELETE CASCADE,
            project_document_id UUID NOT NULL REFERENCES projects_documents(id) ON DELETE CASCADE,
            status VARCHAR(50) NOT NULL DEFAULT 'active'
                CONSTRAINT publications_status_check CHECK (status IN ('pending', 'active', 'archived')),
            published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            published_by UUID REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id),
            updated_by UUID REFERENCES users(id)
        )
    """)

    # ── Search Index ──────────────────────────────────────────────────────────

    op.execute("""
        CREATE TABLE search_index (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entity_type VARCHAR(100) NOT NULL,
            entity_id UUID NOT NULL,
            content_text TEXT,
            content_summary TEXT,
            routing_path TEXT,
            status VARCHAR(20) NOT NULL DEFAULT 'active'
                CONSTRAINT search_index_status_check CHECK (status IN ('pending', 'active', 'archived')),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE (entity_type, entity_id)
        )
    """)

    # ── Indexes ───────────────────────────────────────────────────────────────

    op.execute("CREATE INDEX idx_documents_created_at ON documents(created_at)")
    op.execute("CREATE INDEX idx_documents_content_fts ON documents USING GIN(to_tsvector('french', COALESCE(content_text, '')))")
    op.execute("CREATE INDEX idx_document_attachments_document_id ON document_attachments(document_id)")
    op.execute("CREATE INDEX idx_document_attachments_file_id ON document_attachments(file_id)")
    op.execute("CREATE INDEX idx_users_email ON users(email)")
    op.execute("CREATE INDEX idx_users_url_param_id ON users(url_param_id)")
    op.execute("CREATE INDEX idx_users_person_id ON users(person_id)")
    op.execute("CREATE UNIQUE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token_hash) WHERE refresh_token_hash IS NOT NULL")
    op.execute("CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id)")
    op.execute("CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id)")
    op.execute("CREATE INDEX idx_represents_user_id ON represents(user_id)")
    op.execute("CREATE INDEX idx_represents_person_id ON represents(person_id)")
    op.execute("CREATE INDEX idx_tribes_url_param_id ON tribes(url_param_id)")
    op.execute("CREATE INDEX idx_tribes_projects_tribe_id ON tribes_projects(tribe_id)")
    op.execute("CREATE INDEX idx_tribes_projects_project_id ON tribes_projects(project_id)")
    op.execute("CREATE INDEX idx_positions_tribe_id ON positions(tribe_id)")
    op.execute("CREATE INDEX idx_positions_person_id ON positions(person_id)")
    op.execute("CREATE INDEX idx_projects_url_param_id ON projects(url_param_id)")
    op.execute("CREATE INDEX idx_projects_features_project_id ON projects_features(project_id)")
    op.execute("CREATE INDEX idx_todo_items_feature_instance_id ON todo_items(feature_instance_id)")
    op.execute("CREATE INDEX idx_kanban_columns_feature_instance ON kanban_columns(feature_instance_id)")
    op.execute("CREATE INDEX idx_kanban_columns_position ON kanban_columns(feature_instance_id, position)")
    op.execute("CREATE INDEX idx_kanban_cards_feature_instance ON kanban_cards(feature_instance_id)")
    op.execute("CREATE INDEX idx_kanban_cards_column ON kanban_cards(column_id)")
    op.execute("CREATE INDEX idx_kanban_cards_parent ON kanban_cards(parent_card_id)")
    op.execute("CREATE INDEX idx_mails_status ON mails(status)")
    op.execute("CREATE INDEX idx_mails_mail_status ON mails(mail_status)")
    op.execute("CREATE INDEX idx_mails_mail_type ON mails(mail_type)")
    op.execute("CREATE INDEX idx_mails_planned_at ON mails(planned_at)")
    op.execute("CREATE INDEX idx_mails_to_mail_id ON mails_to(mail_id)")
    op.execute("CREATE INDEX idx_mails_to_user_id ON mails_to(user_id)")
    op.execute("CREATE INDEX idx_labels_feature_instance ON labels(feature_instance_id)")
    op.execute("CREATE INDEX idx_label_entities_label_id ON label_entities(label_id)")
    op.execute("CREATE INDEX idx_label_entities_entity ON label_entities(entity_type, entity_id)")
    op.execute("CREATE INDEX idx_document_entities_document_id ON document_entities(document_id)")
    op.execute("CREATE INDEX idx_document_entities_entity ON document_entities(entity_type, entity_id)")
    op.execute("CREATE INDEX idx_projects_documents_project_id ON projects_documents(project_id)")
    op.execute("CREATE INDEX idx_projects_documents_document_id ON projects_documents(document_id)")
    op.execute("CREATE INDEX idx_projects_documents_status ON projects_documents(status)")
    op.execute("CREATE INDEX idx_projects_documents_url_param_id ON projects_documents(url_param_id)")
    op.execute("CREATE INDEX idx_document_pages_project_document_id ON document_pages(project_document_id)")
    op.execute("CREATE INDEX idx_document_pages_status ON document_pages(project_document_id, status)")
    op.execute("CREATE INDEX idx_document_pages_content_fts ON document_pages USING GIN(to_tsvector('french', COALESCE(content_text, '')))")
    op.execute("CREATE INDEX idx_publications_document_id ON publications(document_id)")
    op.execute("CREATE INDEX idx_publications_project_document_id ON publications(project_document_id)")
    op.execute("CREATE INDEX idx_publications_published_at ON publications(published_at DESC)")
    op.execute("CREATE INDEX idx_publications_url_param_id ON publications(url_param_id)")
    op.execute("CREATE INDEX idx_notifications_target_status ON notifications(target_user_id, notification_status)")
    op.execute("CREATE INDEX idx_search_index_entity ON search_index(entity_type, entity_id)")
    op.execute("CREATE INDEX idx_search_index_routing_path ON search_index(routing_path)")
    op.execute("CREATE INDEX idx_search_index_content_fts ON search_index USING GIN(to_tsvector('french', COALESCE(content_text, '')))")

    # ── Triggers ─────────────────────────────────────────────────────────────

    for table in (
        'permissions', 'roles', 'documents', 'persons', 'users', 'projects', 'tribes',
        'positions', 'represents', 'mails', 'labels', 'app_config',
        'projects_features', 'todo_items', 'kanban_columns', 'kanban_cards',
        'projects_documents', 'publications', 'user_tab_configs', 'user_bookmarks',
        'notifications', 'document_pages', 'search_index',
    ):
        op.execute(
            f"CREATE TRIGGER update_{table}_updated_at "
            f"BEFORE UPDATE ON {table} "
            f"FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()"
        )

    # ── Search index backfill ─────────────────────────────────────────────────

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
    tables = [
        'search_index',
        'document_pages',
        'notifications',
        'user_bookmarks',
        'user_tab_configs',
        'publications',
        'projects_documents',
        'kanban_cards',
        'kanban_columns',
        'todo_items',
        'projects_features',
        'document_entities',
        'label_entities',
        'labels',
        'app_config',
        'mails_to',
        'mails',
        'positions',
        'tribes_projects',
        'tribes',
        'projects',
        'represents',
        'user_sessions',
        'user_roles',
        'users',
        'persons',
        'document_attachments',
        'documents',
        'role_permissions',
        'roles',
        'permissions',
    ]
    for table in tables:
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
    op.execute("DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE")
