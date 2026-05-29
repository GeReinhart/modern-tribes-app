import { ThemedButton } from '@/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedLoadingSpinner } from '@/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedText } from '@/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';
import { EntityAuditBadge } from '@/platform/core/layout/themes/components/EntityAuditBadge.tsx';
import {
  useProjectDocumentLabels,
  useProjectDocuments,
} from '@/hooks/useProjectDocuments.ts';
import { ProjectDocumentSummary } from '@/types/project-document.types.ts';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Globe, Search, Tag } from 'lucide-react';

interface ProjectDocumentsTabProps {
  projectId: string;
  tribeId: string;
  canEdit: boolean;
  initialLabelId?: string | null;
}

export const ProjectDocumentsTab: React.FC<ProjectDocumentsTabProps> = ({
  projectId,
  tribeId,
  canEdit,
  initialLabelId,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(
    initialLabelId ?? null,
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { documents, loading, error } = useProjectDocuments(
    projectId,
    debouncedSearch || undefined,
    selectedLabelId || undefined,
  );
  const { labels } = useProjectDocumentLabels(projectId);

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '8px 12px 8px 36px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 'var(--font-sm)',
    outline: 'none',
  };

  const labelChipStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    cursor: 'pointer',
    border: `1px solid ${active ? theme.colors.primary : theme.colors.border}`,
    backgroundColor: active
      ? `${theme.colors.primary}15`
      : theme.colors.surface,
    color: active ? theme.colors.primary : theme.colors.secondary,
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  });

  const cardStyle: React.CSSProperties = {
    padding: '16px',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme.colors.secondary,
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('projectDocuments.searchPlaceholder')}
            style={inputStyle}
          />
        </div>
        {canEdit && (
          <ThemedButton
            variant="primary"
            onClick={() =>
              navigate(
                `/app/tribes/${tribeId}/projects/${projectId}/documents/new`,
              )
            }
          >
            {t('projectDocuments.addDocument')}
          </ThemedButton>
        )}
      </div>

      {/* Label filters */}
      {labels.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '16px',
            alignItems: 'center',
          }}
        >
          <Tag size={14} color={theme.colors.secondary} />
          {labels.map((label) => (
            <button
              key={label.id}
              type="button"
              style={labelChipStyle(selectedLabelId === label.id)}
              onClick={() =>
                setSelectedLabelId(
                  selectedLabelId === label.id ? null : label.id,
                )
              }
            >
              {label.name}{' '}
              <span style={{ opacity: 0.6 }}>({label.usage_count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading && (
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}
        >
          <ThemedLoadingSpinner size="sm" />
        </div>
      )}

      {error && (
        <div
          style={{
            color: theme.colors.danger,
            fontSize: 'var(--font-sm)',
            padding: '8px',
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && documents.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <ThemedText variant="secondary" size="small">
            {debouncedSearch || selectedLabelId
              ? t('projectDocuments.noResults')
              : t('projectDocuments.noDocuments')}
          </ThemedText>
        </div>
      )}

      {!loading &&
        documents.map((doc: ProjectDocumentSummary) => (
          <div
            key={doc.id}
            style={{ ...cardStyle, marginBottom: '8px' }}
            onClick={() =>
              navigate(
                `/app/tribes/${tribeId}/projects/${projectId}/documents/${doc.url_param_id}`,
              )
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.primary;
              e.currentTarget.style.backgroundColor = `${theme.colors.primary}08`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border;
              e.currentTarget.style.backgroundColor = theme.colors.surface;
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(
                  `/app/tribes/${tribeId}/projects/${projectId}/documents/${doc.url_param_id}`,
                );
              }
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <ThemedText
                variant="primary"
                size="small"
                style={{ fontWeight: 600, flex: 1 }}
              >
                {doc.title}
              </ThemedText>
              {doc.publication_url_param_id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(
                      `/public/publications/${doc.publication_url_param_id}`,
                    );
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 600,
                    backgroundColor: `${theme.colors.primary}15`,
                    color: theme.colors.primary,
                    border: `1px solid ${theme.colors.primary}40`,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Globe size={11} />
                  {t('publications.published')}
                </button>
              )}
            </div>

            {doc.content_summary && (
              <ThemedText
                variant="secondary"
                size="small"
                style={{ marginBottom: '8px' }}
              >
                {doc.content_summary}
              </ThemedText>
            )}

            {doc.labels.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {doc.labels.map((l) => (
                  <span
                    key={l.id}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: 'var(--font-xs)',
                      backgroundColor: `${theme.colors.accent}20`,
                      color: theme.colors.accent,
                      border: `1px solid ${theme.colors.accent}40`,
                    }}
                  >
                    {l.name}
                  </span>
                ))}
              </div>
            )}
            {doc.created_by && (
              <EntityAuditBadge
                createdBy={doc.created_by}
                updatedBy={doc.updated_by}
                createdAt={doc.created_at}
                updatedAt={doc.updated_at}
              />
            )}
          </div>
        ))}
    </div>
  );
};
