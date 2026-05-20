import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedSection } from '@/components/common/layout/ThemedSection';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner';
import { ThemedBadge } from '@/components/common/layout/ThemedBadge';
import { ThemedConfirmDialog } from '@/components/common/layout/ThemedConfirmDialog';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';
import { useProjectWithDocument, useUserProjectsByTribe } from '@/hooks/useProjects';
import { useTribeWithPositions } from '@/hooks/useTribesWithPositions';
import { useProjectDocument } from '@/hooks/useProjectDocuments';
import { projectDocumentService } from '@/services/project-document.service';
import { errorStyle, containerStyle } from '@/styles/theme.styles';
import { Paperclip, Download, FileText, Image, Film, Music, File, Tag } from 'lucide-react';
import { AttachmentFile } from '@/types/document.types';
import { ProjectEntry } from '@/types/queries/projects.query.types';
import { useMemo } from 'react';

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

const ProjectDocumentViewPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { tribeId, projectId, projectDocumentId } = useParams<{
        tribeId: string;
        projectId: string;
        projectDocumentId: string;
    }>();

    const { user } = useCurrentUserProfile();
    const { tribe } = useTribeWithPositions(tribeId || null);
    const { project } = useProjectWithDocument(projectId || null);
    const { document: doc, loading, error } = useProjectDocument(
        projectId || null,
        projectDocumentId || null
    );
    const { projects: tribeProjects } = useUserProjectsByTribe(
        tribeId || '',
        user?.id || '',
        { enabled: !!tribeId && !!user?.id }
    );

    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [archiving, setArchiving] = useState(false);

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
        if (!myProjectPosition) return false;
        const allPositions = [
            myProjectPosition.direct_position,
            ...myProjectPosition.represented_persons.map(p => p.position),
        ].filter(Boolean);
        return allPositions.some(p => p === 'manager' || p === 'member');
    }, [myProjectPosition]);

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('tribes.title'), path: '/app/tribes' },
        { label: tribe?.name || t('common.loading'), path: `/app/tribes/${tribeId}` },
        { label: project?.name || t('common.loading'), path: `/app/tribes/${tribeId}/projects/${projectId}` },
        { label: doc?.title || t('common.loading') },
    ], [tribe?.name, project?.name, doc?.title, tribeId, projectId, t]);

    const handleArchive = async () => {
        if (!projectId || !projectDocumentId) return;
        setArchiving(true);
        try {
            await projectDocumentService.archive(projectId, projectDocumentId);
            navigate(`/app/tribes/${tribeId}/projects/${projectId}`);
        } catch (err: any) {
            console.error(err);
        } finally {
            setArchiving(false);
            setShowArchiveConfirm(false);
        }
    };

    const headerActions = (
        <div style={{ display: 'flex', gap: '8px' }}>
            <ThemedButton
                variant="ghost"
                onClick={() => navigate(`/app/tribes/${tribeId}/projects/${projectId}?tab=documents`)}
            >
                {t('projectDocuments.backToDocuments')}
            </ThemedButton>
            {canEdit && doc?.status === 'active' && (
                <ThemedButton
                    variant="ghost"
                    onClick={() => navigate(`/app/tribes/${tribeId}/projects/${projectId}/documents/${projectDocumentId}/edit`)}
                >
                    {t('common.edit')}
                </ThemedButton>
            )}
            {isManager && doc?.status === 'active' && (
                <ThemedButton
                    variant="ghost"
                    onClick={() => setShowArchiveConfirm(true)}
                    disabled={archiving}
                >
                    {t('common.archive')}
                </ThemedButton>
            )}
        </div>
    );

    const attachmentCardStyle: React.CSSProperties = {
        padding: '12px 16px',
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
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

    if (error || !doc) {
        return (
            <div style={containerStyle}>
                <div style={errorStyle}>
                    <strong>{t('common.error')}</strong> {error || t('projectDocuments.notFound')}
                </div>
            </div>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
            <ThemedSection themeId="main_1">
                {/* Title & archived badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <ThemedText size="large" as="h1" style={{ margin: 0 }}>
                        {doc.title}
                    </ThemedText>
                    {doc.status === 'archived' && (
                        <ThemedBadge variant="ghost">{t('status.archived')}</ThemedBadge>
                    )}
                </div>

                {/* Labels */}
                {doc.labels.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '16px' }}>
                        <Tag size={14} color={theme.colors.secondary} />
                        {doc.labels.map(l => (
                            <button
                                key={l.id}
                                type="button"
                                onClick={() => navigate(`/app/tribes/${tribeId}/projects/${projectId}?tab=documents&labelId=${l.id}`)}
                                style={{
                                    padding: '2px 10px',
                                    borderRadius: '12px',
                                    fontSize: 'var(--font-xs)',
                                    fontWeight: 500,
                                    backgroundColor: `${theme.colors.accent}20`,
                                    color: theme.colors.accent,
                                    border: `1px solid ${theme.colors.accent}40`,
                                    cursor: 'pointer',
                                    transition: 'opacity 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                            >
                                {l.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                {doc.content_html && (
                    <div
                        className="prose max-w-none"
                        style={{
                            padding: '16px',
                            backgroundColor: theme.colors.surface,
                            borderRadius: '8px',
                            border: `1px solid ${theme.colors.border}`,
                            marginBottom: '16px',
                        }}
                        dangerouslySetInnerHTML={{ __html: doc.content_html }}
                    />
                )}

                {/* Attachments */}
                {doc.attachments && doc.attachments.length > 0 && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Paperclip size={20} color={theme.colors.secondary} />
                            <ThemedText size="small" as="h4">
                                {t('tribes.attachmentsCount', { count: doc.attachments.length })}
                            </ThemedText>
                        </div>
                        {doc.attachments.map((attachment: AttachmentFile) => (
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
            </ThemedSection>

            <ThemedConfirmDialog
                isOpen={showArchiveConfirm}
                onClose={() => setShowArchiveConfirm(false)}
                onConfirm={handleArchive}
                title={t('projectDocuments.archiveTitle')}
                message={t('projectDocuments.archiveMessage', { title: doc.title })}
                confirmText={t('common.archive')}
                variant="warning"
            />
        </AppLayout>
    );
};

export const ProjectDocumentViewPage: React.FC = () => (
    <ThemeProvider defaultTheme="default">
        <ProjectDocumentViewPageContent />
    </ThemeProvider>
);
