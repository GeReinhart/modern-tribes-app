import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { usePerson } from '@/app/platform/functions/people/persons/usePersons.ts';

import React from 'react';

interface PositionPersonProps {
  personId: string | null;
}

export const PositionPersonBadge: React.FC<PositionPersonProps> = ({
  personId,
}) => {
  const { person } = usePerson(personId);

  if (!personId) {
    return <ThemedBadge variant="secondary">No person</ThemedBadge>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <ThemedBadge key={personId} variant="primary">
        {person?.first_name + ' ' + person?.last_name || 'Unknown person'}
      </ThemedBadge>
    </div>
  );
};
