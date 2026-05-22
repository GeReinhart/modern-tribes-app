import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { Globe } from 'lucide-react';

interface Props {
    tribeId: string;
    projectId: string;
    projectDocumentId: string;
    docStatus: string;
    canEdit: boolean;
    isManager: boolean;
    effectivePublicationId: string | null;
    publishing: boolean;
    archiving: boolean;
    onPublish: () => void;
    onUnpublish: () => void;
    onArchive: () => void;
}

export const DocumentViewHeaderActions: React.FC<Props> = ({
    tribeId, projectId, projectDocumentId, docStatus,
    canEdit, isManager, effectivePublicationId,
    publishing, archiving, onPublish, onUnpublish, onArchive,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isActive = docStatus === 'active';

    return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <ThemedButton variant="ghost"
                onClick={() => navigate(`/app/tribes/${tribeId}/projects/${projectId}/documents`)}>
                {t('projectDocuments.backToDocuments')}
            </ThemedButton>
            {canEdit && isActive && (
                <ThemedButton variant="ghost"
                    onClick={() => navigate(`/app/tribes/${tribeId}/projects/${projectId}/documents/${projectDocumentId}/edit`)}>
                    {t('common.edit')}
                </ThemedButton>
            )}
            {isManager && isActive && effectivePublicationId && (
                <ThemedButton variant="ghost"
                    onClick={() => navigate(`/public/publications/${effectivePublicationId}`)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Globe size={14} />{t('publications.view')}
                </ThemedButton>
            )}
            {isManager && isActive && !effectivePublicationId && (
                <ThemedButton variant="primary" onClick={onPublish} disabled={publishing}>
                    {t('publications.publish')}
                </ThemedButton>
            )}
            {isManager && isActive && effectivePublicationId && (
                <ThemedButton variant="ghost" onClick={onUnpublish} disabled={publishing}>
                    {t('publications.unpublish')}
                </ThemedButton>
            )}
            {isManager && isActive && (
                <ThemedButton variant="ghost" onClick={onArchive} disabled={archiving}>
                    {t('common.archive')}
                </ThemedButton>
            )}
        </div>
    );
};
