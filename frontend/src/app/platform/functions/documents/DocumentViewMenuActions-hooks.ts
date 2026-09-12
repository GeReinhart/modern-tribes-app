import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

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

export const documentViewMenuActionsHooks = ({
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
        id: 'projectDocument.backToDocuments',
        icon: 'arrow-left',
        label: t('projectDocuments.backToDocuments'),
        onClick: () =>
          navigate(`/app/tribes/${tribeId}/projects/${projectId}/documents`),
      },
      ...(canEdit && isActive
        ? [
            {
              id: 'projectDocument.edit',
              icon: 'pencil' as const,
              badgeIcon: 'file-text' as const,
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
              id: 'projectDocument.viewPublication',
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
              id: 'projectDocument.publish',
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
              id: 'projectDocument.unpublish',
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
              id: 'projectDocument.archive',
              icon: 'archive' as const,
              badgeIcon: 'file-text' as const,
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
      isActive,
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
