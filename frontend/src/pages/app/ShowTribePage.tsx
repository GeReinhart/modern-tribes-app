import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext.tsx';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText} from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedBadge } from '@/components/common/layout/ThemedBadge';
import { ThemedSection } from "@/components/common/layout/ThemedSection.tsx";
import { ThemedTabs } from '@/components/common/layout/ThemedTabs';
import { ConfirmDialog } from '@/components/common/layout/ConfirmDialog.tsx';
import { useNavigate, useParams } from 'react-router-dom';
import { useTribeWithPositions } from '@/hooks/useTribesWithPositions';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';
import { useUserTribes } from '@/hooks/useTribes';
import { useUserProjectsByTribe } from '@/hooks/useProjects';
import { tribeWithPositionService } from '@/services/app/tribe_with_positions.service.ts';
import {
    containerStyle,
    errorStyle,
} from '@/styles/theme.styles';
import { Paperclip, Download, FileText, Image, Film, Music, File } from 'lucide-react';
import { AttachmentFile } from '@/types/document.types.ts';
import {ThemedLoadingSpinner} from "@/components/common/layout/ThemedLoadingSpinner.tsx";
import {useVerifyAuthorization} from "@/hooks/userVerifyAuthorization.ts";
import { ProjectEntry } from '@/types/queries/projects.query.types';

const ShowTribePageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { tribeId } = useParams<{ tribeId: string }>();
    const { data: authorization, error: authorizationError, verifyAuthorization } = useVerifyAuthorization();
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [archiving, setArchiving] = useState(false);
    const [activeTab, setActiveTab] = useState<'description' | 'projects' | 'members'>('description');

    // Single hook call to get all data
    const { tribe, loading, error } = useTribeWithPositions(tribeId || null);

    const { user } = useCurrentUserProfile();
    const { tribes: userTribes } = useUserTribes(user?.id || '', { enabled: !!user?.id });
    const { projects: tribeProjects } = useUserProjectsByTribe(
        tribeId || '',
        user?.id || '',
        { enabled: !!tribeId && !!user?.id }
    );

    const myPosition = useMemo(() => {
        if (!tribeId) return null;
        const entries = userTribes.filter(r => r.tribe_id === tribeId);
        const direct = entries.find(e => !e.via_represents);
        const represents = entries.filter(e => e.via_represents);
        return {
            direct_position: direct?.position ?? null,
            represented_persons: represents.map(r => ({
                first_name: r.person_first_name,
                last_name: r.person_last_name,
                position: r.position,
            })),
        };
    }, [tribeId, userTribes]);

    const isManager = useMemo(() => {
        if (!myPosition) return false;
        return (
            myPosition.direct_position === 'manager' ||
            myPosition.represented_persons.some(p => p.position === 'manager')
        );
    }, [myPosition]);

    const dedupedProjects = useMemo((): ProjectEntry[] => {
        const map = new Map<string, ProjectEntry>();
        for (const row of tribeProjects) {
            const existing = map.get(row.project_id);
            if (!existing) {
                map.set(row.project_id, {
                    project_id: row.project_id,
                    project_name: row.project_name,
                    direct_position: row.via_represents ? null : row.effective_position,
                    represented_persons: row.via_represents && row.person_first_name && row.person_last_name
                        ? [{ first_name: row.person_first_name, last_name: row.person_last_name, position: row.effective_position }]
                        : [],
                });
            } else {
                if (!row.via_represents) {
                    existing.direct_position = row.effective_position;
                } else if (row.person_first_name && row.person_last_name) {
                    existing.represented_persons.push({
                        first_name: row.person_first_name,
                        last_name: row.person_last_name,
                        position: row.effective_position,
                    });
                }
            }
        }
        return Array.from(map.values());
    }, [tribeProjects]);

    const tabs = useMemo(() => [
        { key: 'description', label: t('tribes.tabDescription') },
        { key: 'projects',    label: t('tribes.tabProjects', { count: dedupedProjects.length }) },
        { key: 'members',     label: t('tribes.tabMembers', { count: tribe?.persons.length ?? 0 }) },
    ], [t, dedupedProjects.length, tribe?.persons.length]);

    // Check authorization when component mounts or tribeId changes
    useEffect(() => {
        if (tribeId) {
            verifyAuthorization([ 'admin','can_access_attached_tribes'], tribeId, 'manager').catch((err) => {
                console.error('Authorization check failed:', err);
            });
        }
    }, [tribeId, verifyAuthorization]);

    const handleArchive = async () => {
        if (!tribeId) return;
        setArchiving(true);
        try {
            await tribeWithPositionService.archiveTribe(tribeId);
            navigate('/app/tribes');
        } finally {
            setArchiving(false);
            setShowArchiveConfirm(false);
        }
    };

    // Conditionally render Edit / Archive buttons only when authorized
    const headerActions = (
        <>
            {isManager && (
                <ThemedButton variant="secondary" onClick={() => navigate(`/app/tribes/${tribeId}/projects/new`)}>
                    {t('projects.addProject')}
                </ThemedButton>
            )}
            {authorization?.authorized && (
                <>
                    <ThemedButton variant="primary" onClick={() => navigate(`/app/tribes/${tribeId}/update`)}>
                        {t('common.edit')}
                    </ThemedButton>
                    <ThemedButton
                        variant="danger"
                        isLoading={archiving}
                        onClick={() => setShowArchiveConfirm(true)}
                    >
                        {t('tribes.archive')}
                    </ThemedButton>
                </>
            )}
        </>
    );

    const breadcrumbs = React.useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('tribes.title'), path: '/app/tribes' },
        { label: tribe?.name || t('common.loading') }
    ], [tribe?.name, t]);

    const memberCardStyle: React.CSSProperties = {
        padding: '12px 16px',
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    };

    const badgeStyle = (type: 'manager' | 'member' | 'guest'): React.CSSProperties => {
        const colors = {
            manager: theme.colors.accent,
            member: theme.colors.primary,
            guest: theme.colors.ghost,
        };

        return {
            padding: '4px 12px',
            backgroundColor: colors[type],
            color: 'white',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
        };
    };

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
                    <ThemedLoadingSpinner size="sm"  />
                </div>
            </div>
        );
    }

    if (error || !tribe) {
        return (
            <div style={containerStyle}>
                <div style={errorStyle}>
                    <strong>Error:</strong> {error || 'Tribe not found'}
                </div>
            </div>
        );
    }

    // Group persons by position
    const managers = tribe.persons.filter(p => p.position === 'manager');
    const members = tribe.persons.filter(p => p.position === 'member');
    const guests = tribe.persons.filter(p => p.position === 'guest');

    return (
        <AppLayout headerActions={headerActions} breadcrumbs={breadcrumbs}>

            {/* Authorization Error Message */}
            {authorizationError && (
                <ThemedCard>
                    <div style={errorStyle}>
                        <strong>Authorization Error:</strong> {authorizationError.message}
                    </div>
                </ThemedCard>
            )}

            {/* User position in this tribe */}
            {myPosition && (myPosition.direct_position || myPosition.represented_persons.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                    {myPosition.direct_position && (
                        <ThemedBadge variant={myPosition.direct_position === 'manager' ? 'accent' : myPosition.direct_position === 'member' ? 'primary' : 'ghost'}>
                            {t(`positions.${myPosition.direct_position}`)}
                        </ThemedBadge>
                    )}
                    {myPosition.represented_persons.map((p, i) => (
                        <ThemedBadge key={i} variant={p.position === 'manager' ? 'accent' : p.position === 'member' ? 'primary' : 'ghost'}>
                            {t(`positions.${p.position}`)} {t('tribes.as')} {p.first_name} {p.last_name}
                        </ThemedBadge>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <ThemedTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={key => setActiveTab(key as typeof activeTab)}
            />

            <div style={{ marginTop: '16px' }}>

                {/* Description tab */}
                {activeTab === 'description' && (
                    <>
                        {tribe.document_content_html ? (
                            <ThemedSection themeId="main_1">
                                <div
                                    className="prose max-w-none"
                                    style={{
                                        padding: '16px',
                                        backgroundColor: theme.colors.surface,
                                        borderRadius: '8px',
                                        border: `1px solid ${theme.colors.border}`,
                                    }}
                                    dangerouslySetInnerHTML={{ __html: tribe.document_content_html }}
                                />
                            </ThemedSection>
                        ) : (
                            <ThemedText variant="secondary" size="small">
                                {t('tribes.descriptionSection')}
                            </ThemedText>
                        )}

                        {tribe.document_attachments && tribe.document_attachments.length > 0 && (
                            <ThemedSection themeId="main_1">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <Paperclip size={20} color={theme.colors.secondary} />
                                    <ThemedText size="small" as="h4">
                                        {t('tribes.attachmentsCount', { count: tribe.document_attachments.length })}
                                    </ThemedText>
                                </div>
                                {tribe.document_attachments.map((attachment: AttachmentFile) => (
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
                                            <span style={{ color: theme.colors.primary }}>{getFileIcon(attachment.type)}</span>
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
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '8px 12px', backgroundColor: theme.colors.primary,
                                                color: 'white', borderRadius: '6px', textDecoration: 'none',
                                                fontSize: '14px', fontWeight: 500, transition: 'opacity 0.2s ease',
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
                    </>
                )}

                {/* Projects tab */}
                {activeTab === 'projects' && (
                    <ThemedSection themeId="main_1">
                        {dedupedProjects.length === 0 ? (
                            <ThemedText variant="secondary" size="small">
                                {t('projects.noProjects')}
                            </ThemedText>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {dedupedProjects.map(project => (
                                    <div
                                        key={project.project_id}
                                        style={{
                                            padding: '12px 16px',
                                            backgroundColor: theme.colors.surface,
                                            border: `1px solid ${theme.colors.border}`,
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onClick={() => navigate(`/app/tribes/${tribeId}/projects/${project.project_id}`)}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                                            e.currentTarget.style.borderColor = theme.colors.primary;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.backgroundColor = theme.colors.surface;
                                            e.currentTarget.style.borderColor = theme.colors.border;
                                        }}
                                    >
                                        <ThemedText variant="primary" size="small">{project.project_name}</ThemedText>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {project.direct_position && (
                                                <ThemedBadge variant={project.direct_position === 'manager' ? 'accent' : project.direct_position === 'member' ? 'primary' : 'ghost'}>
                                                    {t(`positions.${project.direct_position}`)}
                                                </ThemedBadge>
                                            )}
                                            {project.represented_persons.map((p, i) => (
                                                <ThemedBadge key={i} variant={p.position === 'manager' ? 'accent' : p.position === 'member' ? 'primary' : 'ghost'}>
                                                    {t(`positions.${p.position}`)} {t('tribes.as')} {p.first_name} {p.last_name}
                                                </ThemedBadge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ThemedSection>
                )}

                {/* Members tab */}
                {activeTab === 'members' && (
                    <ThemedSection themeId="main_2">
                        {managers.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                {managers.map(person => (
                                    <div key={person.id} style={memberCardStyle}>
                                        <ThemedText variant="primary" size="small">{person.first_name} {person.last_name}</ThemedText>
                                        <span style={badgeStyle('manager')}>{t('positions.manager')}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {members.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                {members.map(person => (
                                    <div key={person.id} style={memberCardStyle}>
                                        <ThemedText variant="primary" size="small">{person.first_name} {person.last_name}</ThemedText>
                                        <span style={badgeStyle('member')}>{t('positions.member')}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {guests.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                {guests.map(person => (
                                    <div key={person.id} style={memberCardStyle}>
                                        <ThemedText variant="primary" size="small">{person.first_name} {person.last_name}</ThemedText>
                                        <span style={badgeStyle('guest')}>{t('positions.guest')}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {tribe.persons.length === 0 && (
                            <ThemedText variant="secondary" size="small">{t('tribes.noMembers')}</ThemedText>
                        )}
                    </ThemedSection>
                )}

            </div>

            {showArchiveConfirm && (
                <ConfirmDialog
                    title={t('tribes.archiveConfirmTitle')}
                    message={t('tribes.archiveConfirmMessage', { name: tribe.name })}
                    confirmLabel={t('tribes.archive')}
                    confirmVariant="danger"
                    onConfirm={handleArchive}
                    onCancel={() => setShowArchiveConfirm(false)}
                />
            )}
        </AppLayout>
    );
};

const ShowTribePage: React.FC = () => {
    return (
        <ThemeProvider defaultTheme="default">
            <ShowTribePageContent />
        </ThemeProvider>
    );
};

export default ShowTribePage;