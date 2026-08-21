import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import CreateGroceriesListModal from './CreateGroceriesListModal.tsx';
import GroceriesListRow from './GroceriesListRow.tsx';
import { useGroceriesLists } from './hooks.ts';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
}

const GroceriesTab: React.FC<Props> = ({ featureInstanceId, canEdit }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { tribeId, projectId } = useParams<{ tribeId: string; projectId: string }>();
  const { lists, persons, error, createList, toggleFavorite, setArchived } = useGroceriesLists(featureInstanceId);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const activeLists = lists.filter((l) => l.status !== 'archived');
  const archivedLists = lists.filter((l) => l.status === 'archived');
  const favoriteLists = activeLists.filter((l) => l.is_favorite);
  const visibleLists = showArchived ? [...activeLists, ...archivedLists] : activeLists;

  const tabActions = useMemo(
    () => [
      ...(canEdit
        ? [
            {
              icon: 'plus' as const,
              label: t('features.groceries.newList'),
              onClick: () => setCreating(true),
            },
          ]
        : []),
      ...(archivedLists.length > 0
        ? [
            {
              icon: (showArchived ? 'eye-off' as const : 'eye' as const),
              label: showArchived
                ? t('features.groceries.hideArchivedLists')
                : t('features.groceries.showArchivedLists', { count: archivedLists.length }),
              onClick: () => setShowArchived((v) => !v),
            },
          ]
        : []),
    ],
    [canEdit, archivedLists.length, showArchived, t],
  );
  useRegisterTabActions(tabActions);

  return (
    <div>
      {error && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: '12px',
            color: theme.colors.danger,
            fontSize: 'var(--font-sm)',
          }}
        >
          {error}
        </div>
      )}

      {lists.length === 0 && (
        <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
          {t('features.groceries.empty')}
        </span>
      )}

      {visibleLists.map((list) => (
        <GroceriesListRow
          key={list.id}
          list={list}
          persons={persons}
          canEdit={canEdit}
          onOpen={() => navigate(`/app/tribes/${tribeId}/projects/${projectId}/groceries/${list.id}`)}
          onToggleFavorite={() => toggleFavorite(list.id, !list.is_favorite)}
          onToggleArchived={() => setArchived(list.id, list.status !== 'archived')}
        />
      ))}

      {creating && (
        <CreateGroceriesListModal
          featureInstanceId={featureInstanceId}
          persons={persons}
          favoriteLists={favoriteLists}
          onClose={() => setCreating(false)}
          onCreate={async (data) => {
            const created = await createList(data);
            if (created) setCreating(false);
          }}
        />
      )}
    </div>
  );
};

export default GroceriesTab;
