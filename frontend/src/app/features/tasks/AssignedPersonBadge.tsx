import { personInitials } from '@/app/platform/functions/people/personInitials.ts';
import { ThemedAvatar } from '@/app/platform/core/layout/themes/components/ThemedAvatar.tsx';

import React from 'react';

interface Props {
  name: string;
  photoUrl?: string | null;
  color: string;
  // Spell the person's name out instead of showing their initials only.
  showName?: boolean;
}

// Who a task is assigned to: their photo in a round when they have one, otherwise a pill of their initials.
export const AssignedPersonBadge: React.FC<Props> = ({ name, photoUrl, color, showName = false }) => {
  if (photoUrl) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <ThemedAvatar photoUrl={photoUrl} initials={personInitials(name)} size={22} title={name} />
        {showName && <span style={{ fontSize: 'var(--font-xs)', color, fontWeight: 600 }}>{name}</span>}
      </span>
    );
  }

  return (
    <span
      title={name}
      style={{
        fontSize: 'var(--font-xs)',
        padding: 'var(--space-xs) var(--space-sm)',
        borderRadius: 'var(--radius-lg)',
        background: color + '22',
        color,
        fontWeight: 600,
        border: `1px solid ${color}44`,
        whiteSpace: 'nowrap',
      }}
    >
      {showName ? name : personInitials(name)}
    </span>
  );
};
