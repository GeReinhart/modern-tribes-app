import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Globe } from 'lucide-react';

interface Props {
  tribeId: string;
  projectId: string;
  projectDocumentId: string;
  docStatus: string;
  canEdit: boolean;
  isManager: boolean;
  effectivePublicationUrlParamId: string | null;
  publishing: boolean;
  archiving: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onArchive: () => void;
}

export const DocumentViewHeaderActions: React.FC<Props> = ({
  tribeId,
  projectId,
  projectDocumentId,
  docStatus,
  canEdit,
  isManager,
  effectivePublicationUrlParamId,
  publishing,
  archiving,
  onPublish,
  onUnpublish,
  onArchive,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isActive = docStatus === 'active';

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <ThemedButton
        variant="ghost"
        onClick={() =>
          navigate(`/app/tribes/${tribeId}/projects/${projectId}/documents`)
        }
        leftIcon={
          <ThemedSvgIcon name="arrow-left" color="currentColor" size={16} />
        }
      >
        {t('projectDocuments.backToDocuments')}
      </ThemedButton>
      {canEdit && isActive && (
        <ThemedButton
          variant="ghost"
          onClick={() =>
            navigate(
              `/app/tribes/${tribeId}/projects/${projectId}/documents/${projectDocumentId}/edit`,
            )
          }
          leftIcon={
            <ThemedSvgIcon name="pencil" color="currentColor" size={16} />
          }
        >
          {t('common.edit')}
        </ThemedButton>
      )}
      {isManager && isActive && effectivePublicationUrlParamId && (
        <ThemedButton
          variant="ghost"
          onClick={() =>
            navigate(`/public/publications/${effectivePublicationUrlParamId}`)
          }
          leftIcon={<Globe size={16} />}
        >
          {t('publications.view')}
        </ThemedButton>
      )}
      {isManager && isActive && !effectivePublicationUrlParamId && (
        <ThemedButton
          variant="primary"
          onClick={onPublish}
          disabled={publishing}
          leftIcon={<ThemedSvgIcon name="eye" color="currentColor" size={16} />}
        >
          {t('publications.publish')}
        </ThemedButton>
      )}
      {isManager && isActive && effectivePublicationUrlParamId && (
        <ThemedButton
          variant="ghost"
          onClick={onUnpublish}
          disabled={publishing}
          leftIcon={
            <ThemedSvgIcon name="eye-off" color="currentColor" size={16} />
          }
        >
          {t('publications.unpublish')}
        </ThemedButton>
      )}
      {isManager && isActive && (
        <ThemedButton
          variant="ghost"
          onClick={onArchive}
          disabled={archiving}
          leftIcon={
            <ThemedSvgIcon name="archive" color="currentColor" size={16} />
          }
        >
          {t('common.archive')}
        </ThemedButton>
      )}
    </div>
  );
};
