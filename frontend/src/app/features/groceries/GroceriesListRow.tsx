import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { GroceriesList, PersonOption } from './types.ts';

interface Props {
  list: GroceriesList;
  persons: PersonOption[];
  onOpen: () => void;
}

const GroceriesListRow: React.FC<Props> = ({ list, persons, onOpen }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const assignee = persons.find((p) => p.id === list.assigned_person_id);
  const isDone = list.list_status === 'done';

  return (
    <ThemedCard onClick={onOpen} variant={isDone ? 'success' : 'primary'} className="mb-2 cursor-pointer">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, color: theme.colors.text }}>
            {list.name || list.scheduled_date}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary }}>
            {list.scheduled_date}
            {assignee ? ` · ${assignee.name}` : ''}
          </div>
        </div>
        <span
          style={{
            fontSize: 'var(--font-xs)',
            fontWeight: 700,
            color: isDone ? theme.colors.success : theme.colors.primary,
          }}
        >
          {isDone ? t('features.groceries.done') : t('features.groceries.planned')}
        </span>
      </div>
    </ThemedCard>
  );
};

export default GroceriesListRow;
