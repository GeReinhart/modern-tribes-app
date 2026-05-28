import { ThemedBadge } from '@/platform/layout/themes/components/ThemedBadge.tsx';
import { useTribe } from '@/hooks/useTribes.ts';

import React from 'react';

interface PositionTribeProps {
  tribeId: string | null;
}

export const PositionTribeBadge: React.FC<PositionTribeProps> = ({
  tribeId,
}) => {
  const { tribe } = useTribe(tribeId);

  if (!tribeId) {
    return <ThemedBadge variant="secondary">No tribe</ThemedBadge>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <ThemedBadge key={tribeId} variant="primary">
        {tribe?.name || 'Unknown tribe'}
      </ThemedBadge>
    </div>
  );
};
