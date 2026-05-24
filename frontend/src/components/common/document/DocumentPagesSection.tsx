import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner';
import { DocumentPage } from '@/types/document-page.types';
import { BookOpen, Plus, Pencil } from 'lucide-react';

interface DocumentPagesSectionProps {
    tribeId: string;
    projectId: string;
    projectDocumentId: string;
    pages: DocumentPage[];
    loading: boolean;
    canEdit: boolean;
    onReadPage?: (page: DocumentPage) => void;
}

export const DocumentPagesSection: React.FC<DocumentPagesSectionProps> = ({
    tribeId,
    projectId,
    projectDocumentId,
    pages,
    loading,
    canEdit,
    onReadPage,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const baseRoute = `/app/tribes/${tribeId}/projects/${projectId}/documents/${projectDocumentId}/pages`;

    const sectionHeaderStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
    };

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

    if (loading) {
        return (
            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
                <ThemedLoadingSpinner size="sm" />
            </div>
        );
    }

    const hasPages = pages.length > 0;

    return (
        <div style={{ marginTop: '32px' }}>
            <div style={sectionHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={18} color={theme.colors.primary} />
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-md)', color: theme.colors.text }}>
                        {t('documentPages.pages')}
                        {hasPages && (
                            <span style={{ marginLeft: '6px', fontSize: 'var(--font-xs)', fontWeight: 500, color: theme.colors.secondary }}>
                                ({pages.length})
                            </span>
                        )}
                    </span>
                </div>
                {canEdit && (
                    <button
                        type="button"
                        onClick={() => navigate(`${baseRoute}/new`)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', borderRadius: '8px',
                            backgroundColor: theme.colors.primary, color: 'white',
                            border: 'none', cursor: 'pointer', fontSize: 'var(--font-sm)', fontWeight: 500,
                        }}
                    >
                        <Plus size={14} />{t('documentPages.addPage')}
                    </button>
                )}
            </div>

            {!hasPages && (
                <p style={{ color: theme.colors.secondary, fontSize: 'var(--font-sm)' }}>
                    {t('documentPages.noPages')}
                </p>
            )}

            {pages.map((page, idx) => (
                <div key={page.id} style={cardStyle}>
                    <div style={{
                        minWidth: '28px', height: '28px', borderRadius: '50%',
                        backgroundColor: `${theme.colors.primary}20`, color: theme.colors.primary,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 'var(--font-xs)', flexShrink: 0,
                    }}>
                        {idx + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: theme.colors.text, fontSize: 'var(--font-sm)', marginBottom: '4px' }}>
                            {page.title}
                        </div>
                        {page.content_summary && (
                            <div style={{ color: theme.colors.secondary, fontSize: 'var(--font-xs)', lineHeight: 1.5 }}>
                                {page.content_summary}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        {onReadPage && (
                            <button
                                type="button"
                                onClick={() => onReadPage(page)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '4px 10px', borderRadius: '6px',
                                    border: `1px solid ${theme.colors.border}`,
                                    backgroundColor: theme.colors.surface, color: theme.colors.secondary,
                                    cursor: 'pointer', fontSize: 'var(--font-xs)',
                                }}
                            >
                                <BookOpen size={12} />{t('documentPages.read')}
                            </button>
                        )}
                        {canEdit && (
                            <button
                                type="button"
                                onClick={() => navigate(`${baseRoute}/${page.url_param_id}/edit`)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '4px 10px', borderRadius: '6px',
                                    border: `1px solid ${theme.colors.border}`,
                                    backgroundColor: theme.colors.surface, color: theme.colors.secondary,
                                    cursor: 'pointer', fontSize: 'var(--font-xs)',
                                }}
                            >
                                <Pencil size={12} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
