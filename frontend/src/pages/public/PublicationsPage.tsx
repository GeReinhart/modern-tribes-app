import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { usePublications, usePublicationLabels } from '@/hooks/usePublications';
import { PublicationSummary } from '@/types/publication.types';
import { LabelInfo } from '@/types/project-document.types';
import { Search, Tag } from 'lucide-react';

function LabelFilters({
    labels, selectedId, onSelect,
}: { labels: LabelInfo[]; selectedId: string | null; onSelect: (id: string | null) => void }) {
    const { theme } = useTheme();
    if (labels.length === 0) return null;
    const chipStyle = (active: boolean): React.CSSProperties => ({
        padding: '4px 14px', borderRadius: '16px', fontSize: 'var(--font-sm)', fontWeight: 500,
        cursor: 'pointer',
        border: `1px solid ${active ? theme.colors.primary : theme.colors.border}`,
        backgroundColor: active ? `${theme.colors.primary}15` : theme.colors.surface,
        color: active ? theme.colors.primary : theme.colors.secondary,
    });
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', alignItems: 'center' }}>
            <Tag size={14} color={theme.colors.secondary} />
            {labels.map(label => (
                <button key={label.id} type="button" style={chipStyle(selectedId === label.id)}
                    onClick={() => onSelect(selectedId === label.id ? null : label.id)}>
                    {label.name}
                </button>
            ))}
        </div>
    );
}

function PublicationCard({ pub, onClick }: { pub: PublicationSummary; onClick: () => void }) {
    const { theme } = useTheme();
    const [hovered, setHovered] = useState(false);
    return (
        <div
            role="button" tabIndex={0}
            style={{
                padding: '20px', borderRadius: '10px', cursor: 'pointer', marginBottom: '12px',
                border: `1px solid ${hovered ? theme.colors.primary : theme.colors.border}`,
                backgroundColor: hovered ? `${theme.colors.primary}08` : theme.colors.surface,
                transition: 'all 0.15s',
            }}
            onClick={onClick}
            onKeyDown={e => { if (e.key === 'Enter') onClick(); }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div style={{ fontWeight: 700, fontSize: 'var(--font-lg)', color: theme.colors.text, marginBottom: '6px' }}>
                {pub.title}
            </div>
            {pub.content_summary && (
                <div style={{ color: theme.colors.secondary, fontSize: 'var(--font-sm)', marginBottom: '10px' }}>
                    {pub.content_summary}
                </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                {pub.labels.map(l => (
                    <span key={l.id} style={{
                        padding: '2px 10px', borderRadius: '12px', fontSize: 'var(--font-xs)',
                        backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent,
                        border: `1px solid ${theme.colors.accent}40`,
                    }}>{l.name}</span>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: 'var(--font-xs)', color: theme.colors.secondary }}>
                    {new Date(pub.published_at).toISOString().slice(0, 10)}
                </span>
            </div>
        </div>
    );
}

const PublicationsPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput), 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const { labels } = usePublicationLabels();
    const { publications, loading, error } = usePublications(debouncedSearch || undefined, selectedLabelId || undefined);

    return (
        <PublicLayout>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ color: theme.colors.text, fontSize: 'var(--font-xl)', fontWeight: 800, marginBottom: '24px' }}>
                    {t('publications.title')}
                </h1>
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <Search size={16} style={{
                        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                        color: theme.colors.secondary, pointerEvents: 'none',
                    }} />
                    <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                        placeholder={t('publications.searchPlaceholder')}
                        style={{
                            width: '100%', padding: '10px 12px 10px 40px',
                            border: `1px solid ${theme.colors.border}`, borderRadius: '8px',
                            backgroundColor: theme.colors.surface, color: theme.colors.text,
                            fontSize: 'var(--font-md)', outline: 'none',
                        }} />
                </div>
                <LabelFilters labels={labels} selectedId={selectedLabelId} onSelect={setSelectedLabelId} />
                {error && <div style={{ color: theme.colors.danger, padding: '8px', marginBottom: '16px' }}>{t('common.error')}</div>}
                {!loading && !error && publications.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '48px', color: theme.colors.secondary }}>
                        {t('publications.noResults')}
                    </div>
                )}
                {publications.map(pub => (
                    <PublicationCard key={pub.id} pub={pub}
                        onClick={() => navigate(`/public/publications/${pub.id}`)} />
                ))}
            </div>
        </PublicLayout>
    );
};

export const PublicationsPage: React.FC = () => (
    <ThemeProvider defaultTheme="default">
        <PublicationsPageContent />
    </ThemeProvider>
);
