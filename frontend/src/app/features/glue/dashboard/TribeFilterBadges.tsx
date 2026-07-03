import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import type { TribeOption } from '@/app/features/glue/dashboard/useTribeFilter.ts';

import React from 'react';

interface Props {
  tribes: TribeOption[];
  selectedTribeIds: Set<string>;
  onToggle: (tribeUrlParamId: string) => void;
}

export const TribeFilterBadges: React.FC<Props> = ({ tribes, selectedTribeIds, onToggle }) => {
  const { theme } = useTheme();

  if (tribes.length < 2) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '0 0 var(--space-md) 0' }}>
      {tribes.map((tribe) => {
        const isSelected = selectedTribeIds.has(tribe.tribe_url_param_id);
        return (
          <button
            key={tribe.tribe_url_param_id}
            type="button"
            onClick={() => onToggle(tribe.tribe_url_param_id)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.border}`,
              backgroundColor: isSelected ? `${theme.colors.primary}25` : theme.colors.surface,
              color: isSelected ? theme.colors.primary : theme.colors.text,
              fontSize: 'var(--font-xs)',
              fontWeight: isSelected ? 700 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'border-color 0.15s, background-color 0.15s',
            }}
          >
            {tribe.tribe_name}
          </button>
        );
      })}
    </div>
  );
};
