import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedSection } from '@/components/common/layout/ThemedSection';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner';
import { ThemedBadge } from '@/components/common/layout/ThemedBadge';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog';
import { DocumentAttachments } from '@/components/common/document/DocumentAttachments';
import { DocumentViewHeaderActions } from '@/components/common/document/DocumentViewHeaderActions';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';
import { useProjectWithDocument, useUserProjectsByTribe } from '@/hooks/useProjects';
import { useTribeWithPositions } from '@/hooks/useTribesWithPositions';
import { useProjectDocument } from '@/hooks/useProjectDocuments';
import { projectDocumentService } from '@/services/project-document.service';
import { publicationService } from '@/services/publication.service';
import { errorStyle, containerStyle } from '@/styles/theme.styles';
import { Tag, Globe } from 'lucide-react';
import { ProjectEntry } from '@/types/queries/projects.query.types';

const ProjectDocumentViewPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { tribeId, projectId, projectDocumentId } = useParams<{
        tribeId: string; projectId: string; projectDocumentId: string;
    }>();

    const { user } = useCurrentUserProfile();
    const { tribe } = useTribeWithPositions(tribeId || null);
    const { project } = useProjectWithDocument(projectId || null);
    const { document: doc, loading, error } = useProjectDocument(projectId || null, projectDocumentId || null);
    const { projects: tribeProjects } = useUserProjectsByTribe(tribeId || '', user?.id || '', { enabled: !!tribeId && !!user?.id });

    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [showPublishConfirm, setShowPublishConfirm] = useState(false);
    const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [publicationId, setPublicationId] = useState<string | null | undefined>(undefined);

    const myProjectPosition = useMemo((): ProjectEntry | null => {
        if (!projectId) return null;
        const rows = tribeProjects.filter(r => r.project_id === projectId);
        if (rows.length === 0) return null;
        const entry: ProjectEntry = { project_id: projectId, project_name: rows[0].project_name, direct_position: null, represented_persons: [] };
        for (const r of rows) {
            if (!r.via_represents) entry.direct_position = r.effective_position;
            else if (r.person_first_name && r.person_last_name) entry.represented_persons.push({ first_name: r.person_first_name, last_name: r.person_last_name, position: r.effective_position });
        }
        return entry;
    }, [projectId, tribeProjects]);

    const isManager = useMemo(() => !myProjectPosition ? false :
        myProjectPosition.direct_position === 'manager' || myProjectPosition.represented_persons.some(p => p.position === 'manager'),
    [myProjectPosition]);

    const canEdit = useMemo(() => !myProjectPosition ? false :
        [myProjectPosition.direct_position, ...myProjectPosition.represented_persons.map(p => p.position)]
            .filter(Boolean).some(p => p === 'manager' || p === 'member'),
    [myProjectPosition]);

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' }, { label: t('tribes.title'), path: '/app/tribes' },
        { label: tribe?.name || t('common.loading'), path: `/app/tribes/${tribeId}` },
        { label: project?.name || t('common.loading'), path: `/app/tribes/${tribeId}/projects/${projectId}` },
        { label: doc?.title || t('common.loading') },
    ], [tribe?.name, project?.name, doc?.title, tribeId, projectId, t]);

    const effectivePublicationId = publicationId !== undefined ? publicationId : (doc?.publication_id ?? null);

    const handlePublish = async () => {
        if (!projectId || !projectDocumentId) return;
        setPublishing(true);
        try { const r = await publicationService.publish(projectId, projectDocumentId); setPublicationId(r.publication_id); }
        catch (e) { console.error(e); }
        finally { setPublishing(false); setShowPublishConfirm(false); }
    };

    const handleUnpublish = async () => {
        if (!projectId || !projectDocumentId) return;
        setPublishing(true);
        try { await publicationService.unpublish(projectId, projectDocumentId); setPublicationId(null); }
        catch (e) { console.error(e); }
        finally { setPublishing(false); setShowUnpublishConfirm(false); }
    };

    const handleArchive = async () => {
        if (!projectId || !projectDocumentId) return;
        setArchiving(true);
        try { await projectDocumentService.archive(projectId, projectDocumentId); navigate(`/app/tribes/${tribeId}/projects/${projectId}`); }
        catch (e) { console.error(e); }
        finally { setArchiving(false); setShowArchiveConfirm(false); }
    };

    if (loading) return <div style={containerStyle}><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}><ThemedLoadingSpinner size="sm" /></div></div>;
    if (error || !doc) return <div style={containerStyle}><div style={errorStyle}><strong>{t('common.error')}</strong> {error || t('projectDocuments.notFound')}</div></div>;

    const headerActions = <DocumentViewHeaderActions
        tribeId={tribeId!} projectId={projectId!} projectDocumentId={projectDocumentId!}
        docStatus={doc.status} canEdit={canEdit} isManager={isManager}
        effectivePublicationId={effectivePublicationId} publishing={publishing} archiving={archiving}
        onPublish={() => setShowPublishConfirm(true)} onUnpublish={() => setShowUnpublishConfirm(true)} onArchive={() => setShowArchiveConfirm(true)}
    />;

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
            <ThemedSection themeId="main_1">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {doc.status === 'archived' && <ThemedBadge variant="ghost">{t('status.archived')}</ThemedBadge>}
                    {effectivePublicationId && (
                        <button type="button" onClick={() => navigate(`/public/publications/${effectivePublicationId}`)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '12px', fontSize: 'var(--font-xs)', fontWeight: 600, backgroundColor: `${theme.colors.primary}15`, color: theme.colors.primary, border: `1px solid ${theme.colors.primary}40`, cursor: 'pointer' }}>
                            <Globe size={12} />{t('publications.published')}
                        </button>
                    )}
                </div>
                {doc.labels.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '16px' }}>
                        <Tag size={14} color={theme.colors.secondary} />
                        {doc.labels.map(l => (
                            <button key={l.id} type="button"
                                onClick={() => navigate(`/app/tribes/${tribeId}/projects/${projectId}/documents?labelId=${l.id}`)}
                                style={{ padding: '2px 10px', borderRadius: '12px', fontSize: 'var(--font-xs)', fontWeight: 500, backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent, border: `1px solid ${theme.colors.accent}40`, cursor: 'pointer' }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                {l.name}
                            </button>
                        ))}
                    </div>
                )}
                {doc.content_html && (
                    <div className="prose max-w-none" style={{ padding: '16px', backgroundColor: theme.colors.surface, borderRadius: '8px', border: `1px solid ${theme.colors.border}`, marginBottom: '16px' }}
                        dangerouslySetInnerHTML={{ __html: doc.content_html }} />
                )}
                <DocumentAttachments attachments={doc.attachments ?? []} />
            </ThemedSection>
            <ThemedConfirmDialog isOpen={showArchiveConfirm} onClose={() => setShowArchiveConfirm(false)} onConfirm={handleArchive}
                title={t('projectDocuments.archiveTitle')} message={t('projectDocuments.archiveMessage', { title: doc.title })}
                confirmText={t('common.archive')} variant="warning" isLoading={archiving} />
            <ThemedConfirmDialog isOpen={showPublishConfirm} onClose={() => setShowPublishConfirm(false)} onConfirm={handlePublish}
                title={t('publications.publishConfirmTitle')} message={t('publications.publishConfirmMessage', { title: doc.title })}
                confirmText={t('publications.publish')} variant="info" isLoading={publishing} />
            <ThemedConfirmDialog isOpen={showUnpublishConfirm} onClose={() => setShowUnpublishConfirm(false)} onConfirm={handleUnpublish}
                title={t('publications.unpublishConfirmTitle')} message={t('publications.unpublishConfirmMessage', { title: doc.title })}
                confirmText={t('publications.unpublish')} variant="warning" isLoading={publishing} />
        </AppLayout>
    );
};

export const ProjectDocumentViewPage: React.FC = () => (
    <ThemeProvider defaultTheme="default">
        <ProjectDocumentViewPageContent />
    </ThemeProvider>
);
