import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext.tsx';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText} from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedSection } from "@/components/common/layout/ThemedSection.tsx";
import { ConfirmDialog } from '@/components/common/layout/ConfirmDialog.tsx';
import { useNavigate, useParams } from 'react-router-dom';
import { useTribeWithPositions } from '@/hooks/useTribesWithPositions';
import { tribeWithPositionService } from '@/services/app/tribe_with_positions.service.ts';
import {
    containerStyle,
    errorStyle,
} from '@/styles/theme.styles';
import { Paperclip, Download, FileText, Image, Film, Music, File } from 'lucide-react';
import { AttachmentFile } from '@/types/document.types.ts';
import {ThemedLoadingSpinner} from "@/components/common/layout/ThemedLoadingSpinner.tsx";
import {useVerifyAuthorization} from "@/hooks/userVerifyAuthorization.ts";

const ShowTribePageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { tribeId } = useParams<{ tribeId: string }>();
    const { data: authorization, error: authorizationError, verifyAuthorization } = useVerifyAuthorization();
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [archiving, setArchiving] = useState(false);

    // Single hook call to get all data
    const { tribe, loading, error } = useTribeWithPositions(tribeId || null);

    // Check authorization when component mounts or tribeId changes
    useEffect(() => {
        if (tribeId) {
            verifyAuthorization([ 'admin','can_access_attached_tribes'], tribeId, 'chief').catch((err) => {
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

    const badgeStyle = (type: 'chief' | 'member' | 'guest'): React.CSSProperties => {
        const colors = {
            chief: theme.colors.accent,
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
    const chiefs = tribe.persons.filter(p => p.position === 'chief');
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

            {/* Tribe Description */}
            {tribe.document_content_html && (
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
                        dangerouslySetInnerHTML={{ __html: tribe.document_content_html }}
                    />
                </ThemedSection>
            )}

            {/* Attachments Section */}
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
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${theme.colors.primary}10`;
                                e.currentTarget.style.borderColor = theme.colors.primary;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = theme.colors.surface;
                                e.currentTarget.style.borderColor = theme.colors.border;
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: theme.colors.primary }}>
                                    {getFileIcon(attachment.type)}
                                </span>
                                <div>
                                    <ThemedText variant="primary" size="small">
                                        {attachment.name}
                                    </ThemedText>
                                    <ThemedText variant="secondary" size="small">
                                        {formatFileSize(attachment.size)}
                                    </ThemedText>
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
                                    transition: 'opacity 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.opacity = '0.9';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.opacity = '1';
                                }}
                            >
                                <Download size={16} />
                                {t('tribes.download')}
                            </a>
                        </div>
                    ))}
                </ThemedSection>
            )}

            {/* Members Section */}
            <ThemedSection themeId="main_2">
                <ThemedText size="medium" as="h2">
                    {t('tribes.membersCount', { count: tribe.persons.length })}
                </ThemedText>

                {/* Chiefs */}
                {chiefs.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        {chiefs.map((person) => (
                            <div key={person.id} style={memberCardStyle}>
                                <ThemedText variant="primary" size="small">
                                    {person.first_name} {person.last_name}
                                </ThemedText>
                                <span style={badgeStyle('chief')}>{t('positions.chief')}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Members */}
                {members.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        {members.map((person) => (
                            <div key={person.id} style={memberCardStyle}>
                                <ThemedText variant="primary" size="small">
                                    {person.first_name} {person.last_name}
                                </ThemedText>
                                <span style={badgeStyle('member')}>{t('positions.member')}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Guests */}
                {guests.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        {guests.map((person) => (
                            <div key={person.id} style={memberCardStyle}>
                                <ThemedText variant="primary" size="small">
                                    {person.first_name} {person.last_name}
                                </ThemedText>
                                <span style={badgeStyle('guest')}>{t('positions.guest')}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* No Members */}
                {tribe.persons.length === 0 && (
                    <ThemedText variant="secondary" size="small">
                        {t('tribes.noMembers')}
                    </ThemedText>
                )}
            </ThemedSection>

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