import { MenuAction } from '@/types/menu.types';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Params {
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

export const useDocumentViewMenuActions = ({
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
}: Params): MenuAction[] => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isActive = docStatus === 'active';

  return useMemo(
    (): MenuAction[] => [
      {
        icon: 'arrow-left',
        label: t('projectDocuments.backToDocuments'),
        onClick: () =>
          navigate(`/app/tribes/${tribeId}/projects/${projectId}/documents`),
      },
      ...(canEdit && isActive
        ? [
            {
              icon: 'pencil' as const,
              label: t('common.edit'),
              onClick: () =>
                navigate(
                  `/app/tribes/${tribeId}/projects/${projectId}/documents/${projectDocumentId}/edit`,
                ),
            },
          ]
        : []),
      ...(isManager && isActive && effectivePublicationUrlParamId
        ? [
            {
              icon: 'external-link' as const,
              label: t('publications.view'),
              onClick: () =>
                navigate(
                  `/public/publications/${effectivePublicationUrlParamId}`,
                ),
            },
          ]
        : []),
      ...(isManager && isActive && !effectivePublicationUrlParamId
        ? [
            {
              icon: 'upload' as const,
              label: t('publications.publish'),
              onClick: onPublish,
              disabled: publishing,
            },
          ]
        : []),
      ...(isManager && isActive && !!effectivePublicationUrlParamId
        ? [
            {
              icon: 'download' as const,
              label: t('publications.unpublish'),
              onClick: onUnpublish,
              disabled: publishing,
            },
          ]
        : []),
      ...(isManager && isActive
        ? [
            {
              icon: 'archive' as const,
              label: t('common.archive'),
              onClick: onArchive,
              variant: 'danger' as const,
              disabled: archiving,
            },
          ]
        : []),
    ],
    [
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
      t,
      navigate,
    ],
  );
};
