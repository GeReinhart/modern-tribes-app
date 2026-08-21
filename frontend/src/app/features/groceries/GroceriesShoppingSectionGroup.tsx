import { ThemedCheckbox } from '@/app/platform/core/layout/themes/components/ThemedCheckbox.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';

import { formatQuantityUnit } from './formatQuantity.ts';
import GroceriesSectionToggleHeader from './GroceriesSectionToggleHeader.tsx';
import { SectionGroup } from './sectionGrouping.ts';
import { GroceriesListItemDetail } from './types.ts';

interface Props {
  group: SectionGroup<GroceriesListItemDetail>;
  canEdit: boolean;
  onTogglePickedUp: (id: string, pickedUp: boolean) => Promise<void>;
}

const GroceriesShoppingSectionGroup: React.FC<Props> = ({ group, canEdit, onTogglePickedUp }) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ marginBottom: '16px' }}>
      <GroceriesSectionToggleHeader
        icon={group.icon}
        name={group.name}
        count={group.items.length}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '18px' }}>
          {group.items.map((item) => (
            <div key={item.id} style={{ opacity: canEdit ? 1 : 0.6, pointerEvents: canEdit ? 'auto' : 'none' }}>
              <ThemedCheckbox
                label={`${item.name} — ${formatQuantityUnit(item.quantity, item.unit, item.is_divisible)}`}
                checked={item.picked_up}
                onChange={(checked) => onTogglePickedUp(item.id, checked)}
              />
              {item.comment && (
                <div style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary, marginLeft: '28px' }}>
                  {item.comment}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroceriesShoppingSectionGroup;
