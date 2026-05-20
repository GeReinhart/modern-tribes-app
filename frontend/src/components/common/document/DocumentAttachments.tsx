import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { AttachmentFile } from '@/types/document.types';
import { getFileIcon, formatFileSize } from '@/utils/fileUtils';
import { Paperclip, Download } from 'lucide-react';

interface DocumentAttachmentsProps {
    attachments: AttachmentFile[];
}

export const DocumentAttachments: React.FC<DocumentAttachmentsProps> = ({ attachments }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    if (attachments.length === 0) return null;

    const cardStyle: React.CSSProperties = {
        padding: '12px 16px',
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    };

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Paperclip size={20} color={theme.colors.secondary} />
                <span style={{ color: theme.colors.text, fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                    {t('tribes.attachmentsCount', { count: attachments.length })}
                </span>
            </div>
            {attachments.map((a: AttachmentFile) => (
                <div key={a.id} style={cardStyle}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`; e.currentTarget.style.borderColor = theme.colors.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = theme.colors.surface; e.currentTarget.style.borderColor = theme.colors.border; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: theme.colors.primary }}>{getFileIcon(a.type)}</span>
                        <div>
                            <div style={{ color: theme.colors.text, fontWeight: 500, fontSize: 'var(--font-sm)' }}>{a.name}</div>
                            <div style={{ color: theme.colors.secondary, fontSize: 'var(--font-xs)' }}>{formatFileSize(a.size)}</div>
                        </div>
                    </div>
                    <a href={a.url} download={a.name} target="_blank" rel="noopener noreferrer"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
                            backgroundColor: theme.colors.primary, color: 'white', borderRadius: '6px',
                            textDecoration: 'none', fontSize: 'var(--font-sm)', fontWeight: 500,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                    >
                        <Download size={16} />{t('tribes.download')}
                    </a>
                </div>
            ))}
        </>
    );
};
