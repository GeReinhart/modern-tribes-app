import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedBadge } from '@/components/common/layout/ThemedBadge';
import { ThemedSection } from '@/components/common/layout/ThemedSection';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';
import { useProjectWithDocument, useUserProjectsByTribe } from '@/hooks/useProjects';
import { useTribeWithPositions } from '@/hooks/useTribesWithPositions';
import { errorStyle, containerStyle } from '@/styles/theme.styles';
import { Paperclip, Download, FileText, Image, Film, Music, File } from 'lucide-react';
import { AttachmentFile } from '@/types/document.types';
import { ProjectEntry } from '@/types/queries/projects.query.types';

const getPositionVariant = (position: string): 'primary' | 'accent' | 'ghost' => {
    if (position === 'manager') return 'accent';
    if (position === 'member') return 'primary';
    return 'ghost';
};

const ShowProjectPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { tribeId, projectId } = useParams<{ tribeId: string; projectId: string }>();

    const { user } = useCurrentUserProfile();
    const { tribe } = useTribeWithPositions(tribeId || null);
    const { project, loading, error } = useProjectWithDocument(projectId || null);
    const { projects: tribeProjects } = useUserProjectsByTribe(
        tribeId || '',
        user?.id || '',
        { enabled: !!tribeId && !!user?.id }
    );

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

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('tribes.title'), path: '/app/tribes' },
        { label: tribe?.name || t('common.loading'), path: `/app/tribes/${tribeId}` },
        { label: project?.name || t('common.loading') },
    ], [tribe?.name, project?.name, tribeId, t]);

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
        <ThemedButton variant="primary" onClick={() => navigate(`/app/tribes/${tribeId}/projects/${projectId}/edit`)}>
            {t('projects.editProject')}
        </ThemedButton>
    ) : undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>

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

            {/* Project Title */}
            <ThemedCard>
                <ThemedText size="large" as="h1">{project.name}</ThemedText>
            </ThemedCard>

            {/* Description */}
            {project.document_content_html && (
                <ThemedSection themeId="main_1">
                    <ThemedText size="medium" as="h2">
                        {t('tribes.descriptionSection')}
                    </ThemedText>
                    <div
                        className="prose max-w-none"
                        style={{
                            padding: '16px',
                            backgroundColor: theme.colors.surface,
                            borderRadius: '8px',
                            border: `1px solid ${theme.colors.border}`,
                        }}
                        dangerouslySetInnerHTML={{ __html: project.document_content_html }}
                    />
                </ThemedSection>
            )}

            {/* Attachments */}
            {project.document_attachments && project.document_attachments.length > 0 && (
                <ThemedSection themeId="main_1">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
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
                </ThemedSection>
            )}
        </AppLayout>
    );
};

const ShowProjectPage: React.FC = () => (
    <ThemeProvider defaultTheme="default"><ShowProjectPageContent /></ThemeProvider>
);

export default ShowProjectPage;
