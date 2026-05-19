"""Rename project_feature_instances to projects_features

Revision ID: 019
Revises: 018
Create Date: 2026-05-19

"""
from alembic import op

revision = '019'
down_revision = '018'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE project_feature_instances RENAME TO projects_features")
    op.execute("ALTER INDEX idx_project_feature_instances_project_id RENAME TO idx_projects_features_project_id")
    op.execute("ALTER TRIGGER update_project_feature_instances_updated_at ON projects_features RENAME TO update_projects_features_updated_at")


def downgrade() -> None:
    op.execute("ALTER TRIGGER update_projects_features_updated_at ON projects_features RENAME TO update_project_feature_instances_updated_at")
    op.execute("ALTER INDEX idx_projects_features_project_id RENAME TO idx_project_feature_instances_project_id")
    op.execute("ALTER TABLE projects_features RENAME TO project_feature_instances")
