import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useUrlTab } from '@/hooks/useUrlTab';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedBadge } from '@/components/common/layout/ThemedBadge';
import { ThemedSection } from '@/components/common/layout/ThemedSection';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner';
import { ThemedTabs } from '@/components/common/layout/ThemedTabs';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';
import { useProjectWithDocument, useUserProjectsByTribe } from '@/hooks/useProjects';
import { useTribeWithPositions } from '@/hooks/useTribesWithPositions';
import { useProjectFeatures, useFeatureTypes } from '@/hooks/useProjectFeatures';
import { getFeatureComponent } from '@/features/registry';
import { errorStyle, containerStyle } from '@/styles/theme.styles';
import { Paperclip, Download, FileText, Image, Film, Music, File } from 'lucide-react';
import { ThemedSvgIcon } from '@/components/common/icons/ThemedSvgIcon';
import { AttachmentFile } from '@/types/document.types';
import { ProjectEntry } from '@/types/queries/projects.query.types';
import { ProjectDocumentsTab } from '@/components/entities/projects/ProjectDocumentsTab';

const getPositionVariant = (position: string): 'primary' | 'accent' | 'ghost' => {
    if (position === 'manager') return 'accent';
    if (position === 'member') return 'primary';
    return 'ghost';
};

const AddFeatureModal: React.FC<{
    onClose: () => void;
    onAdd: (featureType: string, name: string) => Promise<void>;
}> = ({ onClose, onAdd }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { featureTypes } = useFeatureTypes();
    const [featureType, setFeatureType] = useState('');
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!featureType || !name.trim()) return;
        setSaving(true);
        await onAdd(featureType, name.trim());
        setSaving(false);
        onClose();
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '8px 12px',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        fontSize: 'var(--font-sm)',
        boxSizing: 'border-box',
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
            <div style={{
                backgroundColor: theme.colors.surface,
                borderRadius: '12px',
                padding: '24px',
                width: '400px',
                maxWidth: '90vw',
                border: `1px solid ${theme.colors.border}`,
            }}>
                <ThemedText size="medium" as="h3" style={{ marginBottom: '16px' }}>
                    {t('features.addFeature')}
                </ThemedText>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: 'var(--font-sm)', marginBottom: '4px', color: theme.colors.secondary }}>
                            {t('features.featureType')}
                        </label>
                        <select
                            value={featureType}
                            onChange={e => setFeatureType(e.target.value)}
                            style={inputStyle}
                            required
                        >
                            <option value="">{t('features.selectType')}</option>
                            {featureTypes.map(ft => (
                                <option key={ft.feature_type} value={ft.feature_type}>{ft.label}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: 'var(--font-sm)', marginBottom: '4px', color: theme.colors.secondary }}>
                            {t('features.featureName')}
                        </label>
                        <input
                            type="text"
                            style={inputStyle}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={t('features.featureNamePlaceholder')}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <ThemedButton variant="ghost" type="button" onClick={onClose} disabled={saving}>
                            {t('common.cancel')}
                        </ThemedButton>
                        <ThemedButton variant="primary" type="submit" disabled={saving || !featureType || !name.trim()}>
                            {t('common.create')}
                        </ThemedButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ShowProjectPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { tribeId, projectId } = useParams<{ tribeId: string; projectId: string }>();
    const [searchParams] = useSearchParams();

    const { user } = useCurrentUserProfile();
    const { tribe } = useTribeWithPositions(tribeId || null);
    const { project, loading, error } = useProjectWithDocument(projectId || null);
    const { projects: tribeProjects } = useUserProjectsByTribe(
        tribeId || '',
        user?.id || '',
        { enabled: !!tribeId && !!user?.id }
    );
    const { features, createFeature, renameFeature, archiveFeature } = useProjectFeatures(projectId || null);

    const initialLabelId = searchParams.get('labelId') || null;
    const [showAddFeature, setShowAddFeature] = useState(false);
    const [archiveTarget, setArchiveTarget] = useState<{ id: string; name: string } | null>(null);
    const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const myProjectPosition = useMemo((): ProjectEntry | null => {
        if (!projectId) return null;
        const rows = tribeProjects.filter(r => r.project_id === projectId);
        if (rows.length === 0) return null;
        const entry: ProjectEntry = {
            project_id: projectId,
            project_name: rows[0].project_name,
            direct_position: null,
            represented_persons: [],
        };
        for (const r of rows) {
            if (!r.via_represents) {
                entry.direct_position = r.effective_position;
            } else if (r.person_first_name && r.person_last_name) {
                entry.represented_persons.push({
                    first_name: r.person_first_name,
                    last_name: r.person_last_name,
                    position: r.effective_position,
                });
            }
        }
        return entry;
    }, [projectId, tribeProjects]);

    const isManager = useMemo(() => {
        if (!myProjectPosition) return false;
        return (
            myProjectPosition.direct_position === 'manager' ||
            myProjectPosition.represented_persons.some(p => p.position === 'manager')
        );
    }, [myProjectPosition]);

    const canEdit = useMemo(() => {
        if (user?.permissions?.includes('admin')) return true;
        if (!myProjectPosition) return false;
        const allPositions = [
            myProjectPosition.direct_position,
            ...myProjectPosition.represented_persons.map(p => p.position),
        ].filter(Boolean);
        return allPositions.some(p => p === 'manager' || p === 'member');
    }, [myProjectPosition, user]);

    const tabs = useMemo(() => {
        const base = [
            { key: 'description', label: t('tribes.tabDescription') },
            { key: 'documents', label: t('projectDocuments.tab') },
        ];
        const featureTabs = features.map(f => ({ key: f.id, label: f.name }));
        return [...base, ...featureTabs];
    }, [features, t]);

    const basePath = `/app/tribes/${tribeId ?? ''}/projects/${projectId ?? ''}`;
    const { activeTab, breadcrumbTabs, handleTabChange } = useUrlTab(tabs, basePath);

    const activeTabLabel = tabs.find(t => t.key === activeTab)?.label || '';

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('tribes.title'), path: '/app/tribes' },
        { label: tribe?.name || t('common.loading'), path: `/app/tribes/${tribeId}` },
        { label: project?.name || t('common.loading'), path: `/app/tribes/${tribeId}/projects/${projectId}` },
        { label: activeTabLabel || t('common.loading') },
    ], [tribe?.name, project?.name, tribeId, projectId, activeTabLabel, t]);

    const attachmentCardStyle: React.CSSProperties = {
        padding: '12px 16px',
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
        transition: 'all 0.2s ease',
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <Image size={20} />;
        if (type.startsWith('video/')) return <Film size={20} />;
        if (type.startsWith('audio/')) return <Music size={20} />;
        if (type.includes('pdf') || type.includes('document')) return <FileText size={20} />;
        return <File size={20} />;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div style={containerStyle}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                    <ThemedLoadingSpinner size="sm" />
                </div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div style={containerStyle}>
                <div style={errorStyle}>
                    <strong>{t('common.error')}</strong> {error || t('projects.notFound')}
                </div>
            </div>
        );
    }

    const headerActions = isManager ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ThemedButton variant="ghost" onClick={() => setShowAddFeature(true)}>
                {t('features.addFeature')}
            </ThemedButton>
            <ThemedButton variant="ghost" onClick={() => navigate(`/app/tribes/${tribeId}/projects/${projectId}/edit-document`)}>
                {t('projects.editDocument')}
            </ThemedButton>
            <ThemedButton variant="primary" onClick={() => navigate(`/app/tribes/${tribeId}/projects/${projectId}/edit`)}>
                {t('projects.editProject')}
            </ThemedButton>
        </div>
    ) : undefined;

    const activeFeature = features.find(f => f.id === activeTab);
    const FeatureComponent = activeFeature ? getFeatureComponent(activeFeature.feature_type) : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs} breadcrumbTabs={breadcrumbTabs} headerActions={headerActions}>

            {/* User position on this project */}
            {myProjectPosition && (myProjectPosition.direct_position || myProjectPosition.represented_persons.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    {myProjectPosition.direct_position && (
                        <ThemedBadge variant={getPositionVariant(myProjectPosition.direct_position)}>
                            {t(`positions.${myProjectPosition.direct_position}`)}
                        </ThemedBadge>
                    )}
                    {myProjectPosition.represented_persons.map((p, i) => (
                        <ThemedBadge key={i} variant={getPositionVariant(p.position)}>
                            {t(`positions.${p.position}`)} {t('tribes.as')} {p.first_name} {p.last_name}
                        </ThemedBadge>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <ThemedSection themeId="main_1">
                <ThemedTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

                <div style={{ paddingTop: '16px' }}>
                    {activeTab === 'documents' && projectId && tribeId && (
                        <ProjectDocumentsTab
                            projectId={projectId}
                            tribeId={tribeId}
                            canEdit={canEdit}
                            initialLabelId={initialLabelId}
                        />
                    )}

                    {activeTab === 'description' && (
                        <>
                            {/* Description */}
                            {project.document_content_html && (
                                <div
                                    className="prose max-w-none"
                                    style={{
                                        padding: '16px',
                                        backgroundColor: theme.colors.surface,
                                        borderRadius: '8px',
                                        border: `1px solid ${theme.colors.border}`,
                                        marginBottom: '16px',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: project.document_content_html }}
                                />
                            )}

                            {/* Attachments */}
                            {project.document_attachments && project.document_attachments.length > 0 && (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <Paperclip size={20} color={theme.colors.secondary} />
                                        <ThemedText size="small" as="h4">
                                            {t('tribes.attachmentsCount', { count: project.document_attachments.length })}
                                        </ThemedText>
                                    </div>
                                    {project.document_attachments.map((attachment: AttachmentFile) => (
                                        <div
                                            key={attachment.id}
                                            style={attachmentCardStyle}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                                                e.currentTarget.style.borderColor = theme.colors.primary;
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.backgroundColor = theme.colors.surface;
                                                e.currentTarget.style.borderColor = theme.colors.border;
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ color: theme.colors.primary }}>
                                                    {getFileIcon(attachment.type)}
                                                </span>
                                                <div>
                                                    <ThemedText variant="primary" size="small">{attachment.name}</ThemedText>
                                                    <ThemedText variant="secondary" size="small">{formatFileSize(attachment.size)}</ThemedText>
                                                </div>
                                            </div>
                                            <a
                                                href={attachment.url}
                                                download={attachment.name}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    padding: '8px 12px',
                                                    backgroundColor: theme.colors.primary,
                                                    color: 'white',
                                                    borderRadius: '6px',
                                                    textDecoration: 'none',
                                                    fontSize: '14px',
                                                    fontWeight: 500,
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                            >
                                                <Download size={16} />
                                                {t('tribes.download')}
                                            </a>
                                        </div>
                                    ))}
                                </>
                            )}
                        </>
                    )}

                    {activeFeature && FeatureComponent && (
                        <FeatureComponent
                            featureInstanceId={activeFeature.id}
                            canEdit={canEdit}
                            isManager={isManager}
                            actions={isManager ? (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        onClick={() => { setRenameValue(activeFeature.name); setRenameTarget({ id: activeFeature.id, name: activeFeature.name }); }}
                                        title={t('features.rename')}
                                        style={{ background: 'none', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px 10px' }}
                                    >
                                        <ThemedSvgIcon name="pencil" color={theme.colors.secondary} size={16} />
                                    </button>
                                    <button
                                        onClick={() => setArchiveTarget({ id: activeFeature.id, name: activeFeature.name })}
                                        title={t('features.archive')}
                                        style={{ background: 'none', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '6px 10px' }}
                                    >
                                        <ThemedSvgIcon name="archive" color={theme.colors.secondary} size={16} />
                                    </button>
                                </div>
                            ) : undefined}
                        />
                    )}

                    {activeFeature && !FeatureComponent && (
                        <ThemedText variant="secondary" size="small">
                            {t('features.unknownType', { type: activeFeature.feature_type })}
                        </ThemedText>
                    )}
                </div>
            </ThemedSection>

            <ThemedConfirmDialog
                isOpen={!!archiveTarget}
                onClose={() => setArchiveTarget(null)}
                onConfirm={async () => {
                    if (!archiveTarget) return;
                    await archiveFeature(archiveTarget.id);
                    navigate(`/app/tribes/${tribeId}/projects/${projectId}/description`);
                    setArchiveTarget(null);
                }}
                title={t('features.archiveTitle')}
                message={t('features.archiveMessage', { name: archiveTarget?.name ?? '' })}
                confirmText={t('tribes.archive')}
                variant="warning"
            />

            {showAddFeature && (
                <AddFeatureModal
                    onClose={() => setShowAddFeature(false)}
                    onAdd={async (featureType, name) => {
                        const created = await createFeature({ feature_type: featureType, name, position: features.length });
                        if (created) navigate(`/app/tribes/${tribeId}/projects/${projectId}/${created.id}`);
                    }}
                />
            )}

            {renameTarget && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: theme.colors.surface, borderRadius: '12px', padding: '24px', width: '360px', maxWidth: '90vw', border: `1px solid ${theme.colors.border}` }}>
                        <ThemedText size="medium" as="h3" style={{ marginBottom: '16px' }}>{t('features.rename')}</ThemedText>
                        <form onSubmit={async e => {
                            e.preventDefault();
                            const trimmed = renameValue.trim();
                            if (trimmed && trimmed !== renameTarget.name) await renameFeature(renameTarget.id, trimmed);
                            setRenameTarget(null);
                        }}>
                            <input
                                autoFocus
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Escape') setRenameTarget(null); }}
                                style={{ width: '100%', padding: '8px 12px', border: `1px solid ${theme.colors.border}`, borderRadius: '8px', backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 'var(--font-sm)', boxSizing: 'border-box', marginBottom: '16px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <ThemedButton variant="ghost" type="button" onClick={() => setRenameTarget(null)}>{t('common.cancel')}</ThemedButton>
                                <ThemedButton variant="primary" type="submit" disabled={!renameValue.trim()}>{t('common.save')}</ThemedButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
};

const ShowProjectPage: React.FC = () => (
    <ThemeProvider defaultTheme="default"><ShowProjectPageContent /></ThemeProvider>
);

export default ShowProjectPage;
