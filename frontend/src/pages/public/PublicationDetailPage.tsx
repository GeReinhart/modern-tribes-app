import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { DocumentAttachments } from '@/components/common/document/DocumentAttachments';
import { publicationService } from '@/services/publication.service';
import { PublicationDetail } from '@/types/publication.types';
import { ArrowLeft, Tag } from 'lucide-react';

function PublicationMeta({ pub }: { pub: PublicationDetail }) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const date = new Date(pub.published_at).toISOString().slice(0, 10);
    return (
        <>
            <h1 style={{ color: theme.colors.text, fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: '8px' }}>
                {pub.title}
            </h1>
            <div style={{ color: theme.colors.secondary, fontSize: 'var(--font-sm)', marginBottom: '16px' }}>
                {pub.author_name && <>{t('publications.author')} <strong>{pub.author_name}</strong> &mdash; </>}
                {t('publications.publishedOn')} {date}
                {pub.published_by_login && <> &mdash; {pub.published_by_login}</>}
            </div>
            {pub.labels.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '20px' }}>
                    <Tag size={14} color={theme.colors.secondary} />
                    {pub.labels.map(l => (
                        <span key={l.id} style={{
                            padding: '2px 10px', borderRadius: '12px', fontSize: 'var(--font-xs)', fontWeight: 500,
                            backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent,
                            border: `1px solid ${theme.colors.accent}40`,
                        }}>{l.name}</span>
                    ))}
                </div>
            )}
        </>
    );
}

const PublicationDetailPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { publicationId } = useParams<{ publicationId: string }>();

    const [publication, setPublication] = useState<PublicationDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!publicationId) return;
        publicationService.getPublication(publicationId)
            .then(setPublication)
            .catch(() => setError(t('publications.notFound')))
            .finally(() => setLoading(false));
    }, [publicationId, t]);

    const backButton = (
        <button type="button" onClick={() => navigate('/public/publications')}
            style={{
                display: 'flex', alignItems: 'center', gap: '6px', background: 'none',
                border: 'none', color: theme.colors.secondary, fontSize: 'var(--font-sm)',
                cursor: 'pointer', marginBottom: '24px', padding: 0,
            }}>
            <ArrowLeft size={16} />{t('publications.backToList')}
        </button>
    );

    if (loading) return <PublicLayout>{backButton}<div style={{ color: theme.colors.secondary, padding: '32px' }}>{t('common.loading')}</div></PublicLayout>;
    if (error || !publication) return <PublicLayout>{backButton}<div style={{ color: theme.colors.danger }}>{error}</div></PublicLayout>;

    return (
        <PublicLayout>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {backButton}
                <PublicationMeta pub={publication} />
                {publication.content_html && (
                    <div className="prose max-w-none" style={{
                        padding: '20px', borderRadius: '10px', marginBottom: '24px',
                        backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}`,
                    }} dangerouslySetInnerHTML={{ __html: publication.content_html }} />
                )}
                <DocumentAttachments attachments={publication.attachments} />
            </div>
        </PublicLayout>
    );
};

export const PublicationDetailPage: React.FC = () => (
    <ThemeProvider defaultTheme="default">
        <PublicationDetailPageContent />
    </ThemeProvider>
);
