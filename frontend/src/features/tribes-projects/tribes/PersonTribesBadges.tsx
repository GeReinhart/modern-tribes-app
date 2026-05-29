import { ThemedBadge } from '@/platform/core/layout/themes/components/ThemedBadge.tsx';
import { useTribes } from '@/features/tribes-projects/tribes/useTribes.ts';

import React from 'react';

interface PersonTribesBadgesProps {
  tribeIds: string[];
}

export const PersonTribesBadges: React.FC<PersonTribesBadgesProps> = ({
  tribeIds,
}) => {
  const { tribes } = useTribes();

  if (!tribeIds || tribeIds.length === 0) {
    return <ThemedBadge variant="secondary">No tribes</ThemedBadge>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tribeIds.map((tribeId) => {
        const tribe = tribes.find((t) => t.id === tribeId);
        return (
          <ThemedBadge key={tribeId} variant="primary">
            {tribe?.name || 'Unknown Tribe'}
          </ThemedBadge>
        );
      })}
    </div>
  );
};
