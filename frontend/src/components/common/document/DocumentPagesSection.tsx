import { EntityAuditBadge } from '@/components/common/audit/EntityAuditBadge';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner';
import { useTheme } from '@/contexts/ThemeContext';
import { documentPageService } from '@/services/document-page.service';
import { DocumentPage } from '@/types/document-page.types';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { BookOpen, ChevronDown, ChevronUp, Pencil } from 'lucide-react';

interface DocumentPagesSectionProps {
  tribeId: string;
  projectId: string;
  projectDocumentId: string;
  pages: DocumentPage[];
  loading: boolean;
  canEdit: boolean;
  onReadPage?: (page: DocumentPage) => void;
  onReordered?: () => void;
}

export const DocumentPagesSection: React.FC<DocumentPagesSectionProps> = ({
  tribeId,
  projectId,
  projectDocumentId,
  pages,
  loading,
  canEdit,
  onReadPage,
  onReordered,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [reordering, setReordering] = useState(false);

  const baseRoute = `/app/tribes/${tribeId}/projects/${projectId}/documents/${projectDocumentId}/pages`;

  const handleMove = async (idx: number, direction: 'up' | 'down') => {
    if (reordering) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= pages.length) return;
    const reordered = [...pages];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    setReordering(true);
    try {
      await documentPageService.reorder(
        projectId,
        projectDocumentId,
        reordered.map((p, i) => ({ page_id: p.id, order_index: i })),
      );
      onReordered?.();
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}
      >
        <ThemedLoadingSpinner size="sm" />
      </div>
    );
  }

  const hasPages = pages.length > 0;
  const cardStyle: React.CSSProperties = {
    padding: '16px',
    backgroundColor: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '10px',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  };
  const iconBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '6px',
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.surface,
    color: theme.colors.secondary,
    cursor: 'pointer',
    fontSize: 'var(--font-xs)',
  };

  return (
    <div style={{ marginTop: '32px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={18} color={theme.colors.primary} />
          <span
            style={{
              fontWeight: 700,
              fontSize: 'var(--font-md)',
              color: theme.colors.text,
            }}
          >
            {t('documentPages.pages')}
            {hasPages && (
              <span
                style={{
                  marginLeft: '6px',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 500,
                  color: theme.colors.secondary,
                }}
              >
                ({pages.length})
              </span>
            )}
          </span>
        </div>
      </div>

      {!hasPages && (
        <p
          style={{ color: theme.colors.secondary, fontSize: 'var(--font-sm)' }}
        >
          {t('documentPages.noPages')}
        </p>
      )}

      {pages.map((page, idx) => (
        <div key={page.id} style={cardStyle}>
          <div
            style={{
              minWidth: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: `${theme.colors.primary}20`,
              color: theme.colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 'var(--font-xs)',
              flexShrink: 0,
            }}
          >
            {idx + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                color: theme.colors.text,
                fontSize: 'var(--font-sm)',
                marginBottom: '4px',
              }}
            >
              {page.title}
            </div>
            {page.content_summary && (
              <div
                style={{
                  color: theme.colors.secondary,
                  fontSize: 'var(--font-xs)',
                  lineHeight: 1.5,
                }}
              >
                {page.content_summary}
              </div>
            )}
            {page.created_by && (
              <EntityAuditBadge
                createdBy={page.created_by}
                updatedBy={page.updated_by}
                createdAt={page.created_at}
                updatedAt={page.updated_at}
              />
            )}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {onReadPage && (
              <button
                type="button"
                onClick={() => onReadPage(page)}
                style={iconBtnStyle}
              >
                <BookOpen size={12} />
                {t('documentPages.read')}
              </button>
            )}
            {canEdit && (
              <>
                <button
                  type="button"
                  disabled={idx === 0 || reordering}
                  onClick={() => handleMove(idx, 'up')}
                  style={{ ...iconBtnStyle, opacity: idx === 0 ? 0.4 : 1 }}
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  type="button"
                  disabled={idx === pages.length - 1 || reordering}
                  onClick={() => handleMove(idx, 'down')}
                  style={{
                    ...iconBtnStyle,
                    opacity: idx === pages.length - 1 ? 0.4 : 1,
                  }}
                >
                  <ChevronDown size={12} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`${baseRoute}/${page.url_param_id}/edit`)
                  }
                  style={iconBtnStyle}
                >
                  <Pencil size={12} />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
