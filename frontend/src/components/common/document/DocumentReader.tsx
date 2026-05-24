import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { DocumentAttachments } from './DocumentAttachments';
import { AttachmentFile } from '@/types/document.types';
import { DocumentPage } from '@/types/document-page.types';
import { X } from 'lucide-react';

interface DocumentReaderProps {
    title: string;
    contentHtml: string;
    attachments: AttachmentFile[];
    pages: DocumentPage[];
    onClose: () => void;
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({
    title,
    contentHtml,
    attachments,
    pages,
    onClose,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const contentStyle: React.CSSProperties = {
        padding: '24px',
        backgroundColor: theme.colors.surface,
        borderRadius: '10px',
        border: `1px solid ${theme.colors.border}`,
        marginBottom: '24px',
    };

    const pageHeaderStyle: React.CSSProperties = {
        fontSize: 'var(--font-lg)',
        fontWeight: 700,
        color: theme.colors.text,
        marginBottom: '16px',
        paddingBottom: '8px',
        borderBottom: `2px solid ${theme.colors.primary}30`,
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h1 style={{ color: theme.colors.text, fontSize: 'var(--font-xl)', fontWeight: 800, margin: 0 }}>
                    {title}
                </h1>
                <button
                    type="button"
                    onClick={onClose}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 12px', borderRadius: '8px',
                        border: `1px solid ${theme.colors.border}`,
                        backgroundColor: theme.colors.surface, color: theme.colors.secondary,
                        cursor: 'pointer', fontSize: 'var(--font-sm)',
                    }}
                >
                    <X size={14} />{t('documentPages.exitRead')}
                </button>
            </div>

            {contentHtml && (
                <div
                    className="prose max-w-none"
                    style={contentStyle}
                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
            )}
            {attachments.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <DocumentAttachments attachments={attachments} />
                </div>
            )}

            {pages.map((page, idx) => (
                <div key={page.id} style={{ marginBottom: '32px' }}>
                    <div style={pageHeaderStyle}>
                        <span style={{ color: theme.colors.secondary, fontSize: 'var(--font-xs)', fontWeight: 500, marginRight: '8px' }}>
                            {t('documentPages.pageOf', { index: idx + 1 })}
                        </span>
                        {page.title}
                    </div>
                    {page.content_html && (
                        <div
                            className="prose max-w-none"
                            style={contentStyle}
                            dangerouslySetInnerHTML={{ __html: page.content_html }}
                        />
                    )}
                    {page.attachments.length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                            <DocumentAttachments attachments={page.attachments} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
