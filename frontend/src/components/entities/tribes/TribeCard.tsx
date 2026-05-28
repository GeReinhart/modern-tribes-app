import { ThemedBadge } from '@/platform/layout/themes/components/ThemedBadge.tsx';
import { ThemedCard } from '@/platform/layout/themes/components/ThemedCard';
import { ThemedText } from '@/platform/layout/themes/components/ThemedText';
import { TribeEntry } from '@/types/queries/tribes.query.types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface ThemedTribeCardProps {
  tribe: TribeEntry;
  onClick: (tribe: TribeEntry) => void;
}

const getPositionVariant = (
  position: string,
): 'primary' | 'secondary' | 'accent' | 'success' | 'danger' | 'ghost' => {
  if (position === 'manager') return 'accent';
  if (position === 'member') return 'primary';
  if (position === 'guest') return 'ghost';
  return 'primary';
};

export const TribeCard: React.FC<ThemedTribeCardProps> = ({
  tribe,
  onClick,
}) => {
  const { t } = useTranslation();

  return (
    <ThemedCard variant="primary" bordered>
      <div onClick={() => onClick(tribe)} style={{ cursor: 'pointer' }}>
        <ThemedText variant="primary" size="medium" as="h3">
          {tribe.tribe_name}
        </ThemedText>

        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            alignItems: 'center',
          }}
        >
          {tribe.direct_position && (
            <ThemedBadge variant={getPositionVariant(tribe.direct_position)}>
              {t(`positions.${tribe.direct_position}`)}
            </ThemedBadge>
          )}
          {tribe.represented_persons.map((p, i) => (
            <ThemedBadge key={i} variant={getPositionVariant(p.position)}>
              {t(`positions.${p.position}`)} {t('tribes.as')} {p.first_name}{' '}
              {p.last_name}
            </ThemedBadge>
          ))}
        </div>
      </div>
    </ThemedCard>
  );
};
