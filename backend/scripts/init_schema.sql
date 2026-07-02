-- PostgreSQL Schema for Modern Tribes Application
-- Reflects full schema (alembic revision 001)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
);

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
);

-- Role-Permission junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
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
);

-- Document attachments table
CREATE TABLE IF NOT EXISTS document_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    file_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    type VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Persons table
CREATE TABLE IF NOT EXISTS persons (
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
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
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
);

-- Foreign key back-references for audit columns (users table now exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permissions_created_by_fkey') THEN
    ALTER TABLE permissions ADD CONSTRAINT permissions_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'permissions_updated_by_fkey') THEN
    ALTER TABLE permissions ADD CONSTRAINT permissions_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_created_by_fkey') THEN
    ALTER TABLE roles ADD CONSTRAINT roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_updated_by_fkey') THEN
    ALTER TABLE roles ADD CONSTRAINT roles_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_created_by_fkey') THEN
    ALTER TABLE documents ADD CONSTRAINT documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documents_updated_by_fkey') THEN
    ALTER TABLE documents ADD CONSTRAINT documents_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'persons_created_by_fkey') THEN
    ALTER TABLE persons ADD CONSTRAINT persons_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'persons_updated_by_fkey') THEN
    ALTER TABLE persons ADD CONSTRAINT persons_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_created_by_fkey') THEN
    ALTER TABLE users ADD CONSTRAINT users_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_updated_by_fkey') THEN
    ALTER TABLE users ADD CONSTRAINT users_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- User-Role junction table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
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
);

-- Represents table (user → persons they can act on behalf of)
CREATE TABLE IF NOT EXISTS represents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    person_id UUID REFERENCES persons(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE (user_id, person_id)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_param_id VARCHAR(6) UNIQUE NOT NULL,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    theme_code VARCHAR(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
);

-- Tribes table
CREATE TABLE IF NOT EXISTS tribes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_param_id VARCHAR(6) UNIQUE NOT NULL,
    name VARCHAR(255) UNIQUE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    theme_code VARCHAR(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'archived'))
);

-- Tribes-Projects relation table
CREATE TABLE IF NOT EXISTS tribes_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tribe_id UUID REFERENCES tribes(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    relation VARCHAR(20) NOT NULL CHECK (relation IN ('manager', 'member', 'guest')),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tribe_id, project_id)
);

-- Positions table
CREATE TABLE IF NOT EXISTS positions (
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
);

-- Mails table
CREATE TABLE IF NOT EXISTS mails (
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
);

-- Mails recipients table
CREATE TABLE IF NOT EXISTS mails_to (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mail_id UUID REFERENCES mails(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (mail_id, user_id)
);

-- Projects features table (named projects_features after migration 019)
CREATE TABLE IF NOT EXISTS projects_features (
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
);

-- Labels table (unified: global admin labels + feature-instance-scoped labels for kanban/todo)
CREATE TABLE IF NOT EXISTS labels (
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
);
CREATE UNIQUE INDEX IF NOT EXISTS labels_name_global_unique ON labels (name) WHERE feature_instance_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS labels_name_feature_unique ON labels (name, feature_instance_id) WHERE feature_instance_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_labels_feature_instance ON labels (feature_instance_id);

-- Label entities table (polymorphic)
CREATE TABLE IF NOT EXISTS label_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label_id UUID REFERENCES labels(id) ON DELETE CASCADE NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (label_id, entity_type, entity_id)
);

-- Document entities table (polymorphic)
CREATE TABLE IF NOT EXISTS document_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (document_id, entity_type, entity_id)
);

-- App config table
CREATE TABLE IF NOT EXISTS app_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Todo items table (final structure from migrations 018+020+021+004)
CREATE TABLE IF NOT EXISTS todo_items (
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
    force_on_dashboard BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);


-- Projects documents table
CREATE TABLE IF NOT EXISTS projects_documents (
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
);

-- Publications table
CREATE TABLE IF NOT EXISTS publications (
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
);

-- Document pages table (migration 012)
CREATE TABLE IF NOT EXISTS document_pages (
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
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_content_fts ON documents USING GIN(to_tsvector('french', COALESCE(content_text, '')));
CREATE INDEX IF NOT EXISTS idx_document_attachments_document_id ON document_attachments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_attachments_file_id ON document_attachments(file_id);
CREATE INDEX IF NOT EXISTS idx_users_url_param_id ON users(url_param_id);
CREATE INDEX IF NOT EXISTS idx_tribes_url_param_id ON tribes(url_param_id);
CREATE INDEX IF NOT EXISTS idx_projects_url_param_id ON projects(url_param_id);
CREATE INDEX IF NOT EXISTS idx_projects_documents_url_param_id ON projects_documents(url_param_id);
CREATE INDEX IF NOT EXISTS idx_publications_url_param_id ON publications(url_param_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_person_id ON users(person_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token_hash) WHERE refresh_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_represents_user_id ON represents(user_id);
CREATE INDEX IF NOT EXISTS idx_represents_person_id ON represents(person_id);
CREATE INDEX IF NOT EXISTS idx_tribes_projects_tribe_id ON tribes_projects(tribe_id);
CREATE INDEX IF NOT EXISTS idx_tribes_projects_project_id ON tribes_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_positions_tribe_id ON positions(tribe_id);
CREATE INDEX IF NOT EXISTS idx_positions_person_id ON positions(person_id);
CREATE INDEX IF NOT EXISTS idx_mails_status ON mails(status);
CREATE INDEX IF NOT EXISTS idx_mails_mail_status ON mails(mail_status);
CREATE INDEX IF NOT EXISTS idx_mails_mail_type ON mails(mail_type);
CREATE INDEX IF NOT EXISTS idx_mails_planned_at ON mails(planned_at);
CREATE INDEX IF NOT EXISTS idx_mails_to_mail_id ON mails_to(mail_id);
CREATE INDEX IF NOT EXISTS idx_mails_to_user_id ON mails_to(user_id);
CREATE INDEX IF NOT EXISTS idx_label_entities_label_id ON label_entities(label_id);
CREATE INDEX IF NOT EXISTS idx_label_entities_entity ON label_entities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_document_entities_document_id ON document_entities(document_id);
CREATE INDEX IF NOT EXISTS idx_document_entities_entity ON document_entities(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_projects_features_project_id ON projects_features(project_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_feature_instance_id ON todo_items(feature_instance_id);
CREATE INDEX IF NOT EXISTS idx_projects_documents_project_id ON projects_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_documents_document_id ON projects_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_projects_documents_status ON projects_documents(status);
CREATE INDEX IF NOT EXISTS idx_publications_document_id ON publications(document_id);
CREATE INDEX IF NOT EXISTS idx_publications_project_document_id ON publications(project_document_id);
CREATE INDEX IF NOT EXISTS idx_publications_published_at ON publications(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_pages_project_document_id ON document_pages(project_document_id);
CREATE INDEX IF NOT EXISTS idx_document_pages_status ON document_pages(project_document_id, status);
CREATE INDEX IF NOT EXISTS idx_document_pages_content_fts ON document_pages USING GIN(to_tsvector('french', COALESCE(content_text, '')));

-- Kanban columns table (migration 024)
CREATE TABLE IF NOT EXISTS kanban_columns (
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
);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_feature_instance ON kanban_columns(feature_instance_id);
CREATE INDEX IF NOT EXISTS idx_kanban_columns_position ON kanban_columns(feature_instance_id, position);

-- Kanban cards table (migration 024)
CREATE TABLE IF NOT EXISTS kanban_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
    parent_card_id UUID REFERENCES kanban_cards(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    assigned_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    position INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('pending', 'active', 'archived')),
    size INTEGER,
    due_date DATE,
    force_on_dashboard BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_feature_instance ON kanban_cards(feature_instance_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_column ON kanban_cards(column_id);
CREATE INDEX IF NOT EXISTS idx_kanban_cards_parent ON kanban_cards(parent_card_id);

-- Notifications table (migration 011)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_param_id VARCHAR(12) UNIQUE NOT NULL,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NULL,
    notification_status VARCHAR(20) NOT NULL DEFAULT 'planned'
        CHECK (notification_status IN ('planned', 'sent', 'failed')),
    scheduled_for TIMESTAMP WITH TIME ZONE NULL,
    reminder_id UUID NULL REFERENCES reminders(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('pending', 'active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_target_status ON notifications(target_user_id, notification_status);
CREATE INDEX IF NOT EXISTS idx_notifications_reminder_id ON notifications(reminder_id);

-- updated_at triggers
CREATE OR REPLACE TRIGGER update_permissions_updated_at BEFORE UPDATE ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_tribes_updated_at BEFORE UPDATE ON tribes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_represents_updated_at BEFORE UPDATE ON represents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_mails_updated_at BEFORE UPDATE ON mails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_labels_updated_at BEFORE UPDATE ON labels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_app_config_updated_at BEFORE UPDATE ON app_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_projects_features_updated_at BEFORE UPDATE ON projects_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_todo_items_updated_at BEFORE UPDATE ON todo_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_projects_documents_updated_at BEFORE UPDATE ON projects_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_publications_updated_at BEFORE UPDATE ON publications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_kanban_columns_updated_at BEFORE UPDATE ON kanban_columns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_kanban_cards_updated_at BEFORE UPDATE ON kanban_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_document_pages_updated_at BEFORE UPDATE ON document_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User tab configs table (migration 007)
CREATE TABLE IF NOT EXISTS user_tab_configs (
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
);
CREATE OR REPLACE TRIGGER update_user_tab_configs_updated_at BEFORE UPDATE ON user_tab_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User bookmarks table (migration 008)
CREATE TABLE IF NOT EXISTS user_bookmarks (
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
);
CREATE OR REPLACE TRIGGER update_user_bookmarks_updated_at BEFORE UPDATE ON user_bookmarks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Search index table (migration 015)
CREATE TABLE IF NOT EXISTS search_index (
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
);
CREATE INDEX IF NOT EXISTS idx_search_index_entity ON search_index(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_search_index_routing_path ON search_index(routing_path);
CREATE INDEX IF NOT EXISTS idx_search_index_content_fts ON search_index USING GIN(to_tsvector('french', COALESCE(content_text, '')));
CREATE OR REPLACE TRIGGER update_search_index_updated_at BEFORE UPDATE ON search_index FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Events (migration 002)
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN NOT NULL DEFAULT FALSE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    size INTEGER CHECK (size > 0),
    force_on_dashboard BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('pending', 'active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_events_feature_instance ON events(feature_instance_id);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);
CREATE OR REPLACE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Events participants (migration 002)
CREATE TABLE IF NOT EXISTS events_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('pending', 'active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(event_id, person_id)
);
CREATE OR REPLACE TRIGGER update_events_participants_updated_at BEFORE UPDATE ON events_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Reminders (migration 006) — generic reminders for any entity (event, todo_item, kanban_card)
CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL
        CHECK (entity_type IN ('event', 'todo_item', 'kanban_card')),
    entity_id UUID NOT NULL,
    remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_type VARCHAR(20) NOT NULL DEFAULT 'notification'
        CHECK (reminder_type IN ('notification', 'mail')),
    sent BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('pending', 'active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_reminders_entity ON reminders(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(remind_at) WHERE sent = FALSE;
CREATE OR REPLACE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Push subscriptions (migration 003)
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('pending', 'active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id, endpoint)
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id) WHERE status = 'active';
CREATE OR REPLACE TRIGGER update_push_subscriptions_updated_at BEFORE UPDATE ON push_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Journal blocks (migration 007)
CREATE TABLE IF NOT EXISTS journal_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_instance_id UUID NOT NULL REFERENCES projects_features(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    position INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('pending', 'active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_journal_blocks_feature_date ON journal_blocks(feature_instance_id, date);
CREATE INDEX IF NOT EXISTS idx_journal_blocks_feature_status ON journal_blocks(feature_instance_id, status);
CREATE OR REPLACE TRIGGER update_journal_blocks_updated_at BEFORE UPDATE ON journal_blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Dashboard pinned tabs (migration 008)
CREATE TABLE IF NOT EXISTS dashboard_pinned_tabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bookmark_id UUID NOT NULL REFERENCES user_bookmarks(id),
    display_order INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('pending', 'active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_user_bookmark_pinned UNIQUE(user_id, bookmark_id)
);
CREATE OR REPLACE TRIGGER update_dashboard_pinned_tabs_updated_at BEFORE UPDATE ON dashboard_pinned_tabs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Schema evolution: add columns that may be missing on databases created before they were introduced
ALTER TABLE tribes_projects ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;
