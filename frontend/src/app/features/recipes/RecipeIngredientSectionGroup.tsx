import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';

import { FoodSectionGroup } from './catalogGrouping.ts';

interface Props {
  group: FoodSectionGroup;
  filter: string;
  onSelect: (itemId: string) => void;
}

const RecipeIngredientSectionGroup: React.FC<Props> = ({ group, filter, onSelect }) => {
  const { theme } = useTheme();
  const [manuallyExpanded, setManuallyExpanded] = useState(false);
  const normalizedFilter = filter.trim().toLowerCase();
  const visibleItems = normalizedFilter === ''
    ? group.items
    : group.items.filter((i) => i.name.toLowerCase().includes(normalizedFilter));

  if (visibleItems.length === 0) return null;

  const expanded = normalizedFilter !== '' || manuallyExpanded;

  return (
    <div style={{ marginBottom: '8px' }}>
      <button
        type="button"
        onClick={() => setManuallyExpanded((v) => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', border: 'none', background: 'transparent',
          cursor: 'pointer', padding: 0, fontSize: 'var(--font-xs)', fontWeight: 700,
          color: theme.colors.secondary, textTransform: 'uppercase',
        }}
      >
        <ThemedSvgIcon name={expanded ? 'chevron-down' : 'chevron-up'} color={theme.colors.secondary} size={12} />
        {group.icon && <ThemedSvgIcon name={group.icon as IconName} color={theme.colors.secondary} size={14} />}
        {group.name}
        <span style={{ fontWeight: 500 }}>({visibleItems.length})</span>
      </button>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '18px', marginTop: '4px' }}>
          {visibleItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                padding: '4px 8px', borderRadius: '6px', border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.surface, cursor: 'pointer', fontSize: 'var(--font-sm)',
                color: theme.colors.text,
              }}
            >
              {item.name} <span style={{ color: theme.colors.secondary }}>({item.unit})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeIngredientSectionGroup;
