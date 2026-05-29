import { useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import {
  KanbanCard,
  KanbanLabel,
  PersonOption,
  fibColor,
  urgencyColor,
} from './types';

interface Props {
  card: KanbanCard;
  boardLabels: KanbanLabel[];
  persons: PersonOption[];
  accentColor: string;
  expanded: boolean;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

const KanbanCardBadges: React.FC<Props> = ({
  card,
  boardLabels,
  persons,
  accentColor,
  expanded,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const cardLabels = boardLabels.filter((l) => card.label_ids.includes(l.id));

  const dueDateBadge = () => {
    if (!card.due_date) return null;
    const uc = urgencyColor(card.due_date, card.size);
    const overdue =
      new Date(card.due_date + 'T00:00:00') <
      new Date(new Date().toDateString());
    return (
      <span
        style={{
          fontSize: 'var(--font-xxs)',
          fontWeight: 600,
          padding: 'var(--space-xs)',
          borderRadius: 'var(--radius-md)',
          background: overdue ? uc : uc + '28',
          color: overdue ? '#fff' : uc,
          flexShrink: 0,
        }}
        title={t('features.kanban.dueDate')}
      >
        {card.due_date}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
      <div style={{ flex: 1 }} />
      {cardLabels.map((l) => (
        <span
          key={l.id}
          title={l.name}
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: l.color,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      ))}
      {card.size && (
        <span
          style={{
            fontSize: 'var(--font-xxs)',
            fontWeight: 700,
            padding: 'var(--space-xs)',
            borderRadius: 'var(--radius-md)',
            background: fibColor(card.size),
            color: theme.colors.surface,
            flexShrink: 0,
          }}
          title={t('features.kanban.size')}
        >
          {card.size}
        </span>
      )}
      {dueDateBadge()}
      {card.assigned_person_name && persons.length > 1 && (
        <span
          style={{
            fontSize: 'var(--font-xs)',
            padding: 'var(--space-xs) var(--space-sm)',
            borderRadius: 'var(--radius-lg)',
            background: accentColor + '22',
            color: accentColor,
            fontWeight: 600,
            border: `1px solid ${accentColor}44`,
            whiteSpace: 'nowrap',
          }}
        >
          {expanded
            ? card.assigned_person_name
            : getInitials(card.assigned_person_name)}
        </span>
      )}
    </div>
  );
};

export default KanbanCardBadges;
