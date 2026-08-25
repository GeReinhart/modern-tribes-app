import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { GroceriesList, PersonOption } from './types.ts';

interface Props {
  list: GroceriesList;
  persons: PersonOption[];
  canEdit: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onToggleArchived: () => void;
}

const GroceriesListRow: React.FC<Props> = ({
  list, persons, canEdit, onOpen, onToggleFavorite, onToggleArchived,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const assignee = persons.find((p) => p.id === list.assigned_person_id);
  const isDone = list.list_status === 'done';
  const isPassed = list.list_status === 'passed';
  const isArchived = list.status === 'archived';
  const statusLabel = isDone
    ? t('features.groceries.done')
    : isPassed
      ? t('features.groceries.passed')
      : t('features.groceries.planned');
  const statusColor = isDone ? theme.colors.success : isPassed ? theme.colors.danger : theme.colors.primary;

  const stopAnd = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <ThemedCard
      onClick={onOpen}
      variant={isArchived ? 'secondary' : isDone ? 'success' : isPassed ? 'danger' : 'primary'}
      className={isArchived ? 'mb-2 cursor-pointer opacity-60' : 'mb-2 cursor-pointer'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, color: theme.colors.text }}>
            {list.name || list.scheduled_date}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary }}>
            {list.scheduled_date}
            {assignee ? ` · ${assignee.name}` : ''}
            {` · ${list.picked_up_count}/${list.items_count}`}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {canEdit && (
            <button
              type="button"
              onClick={stopAnd(onToggleFavorite)}
              title={list.is_favorite ? t('features.groceries.unmarkFavorite') : t('features.groceries.markFavorite')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex' }}
            >
              <ThemedSvgIcon
                name="star"
                color={list.is_favorite ? theme.colors.accent : theme.colors.secondary}
                filled={list.is_favorite}
                size={16}
              />
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={stopAnd(onToggleArchived)}
              title={isArchived ? t('features.groceries.restoreList') : t('features.groceries.archiveList')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.secondary, display: 'flex' }}
            >
              <ThemedSvgIcon name={isArchived ? 'refresh' : 'archive'} color="currentColor" size={16} />
            </button>
          )}
          <span
            style={{
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              color: statusColor,
            }}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </ThemedCard>
  );
};

export default GroceriesListRow;
