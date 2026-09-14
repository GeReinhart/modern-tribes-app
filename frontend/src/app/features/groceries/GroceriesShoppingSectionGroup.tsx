import { ThemedCheckbox } from '@/app/platform/core/layout/themes/components/ThemedCheckbox.tsx';
import { ThemedPopover } from '@/app/platform/core/layout/themes/components/ThemedPopover.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { formatQuantityUnit } from '@/app/platform/core/formatQuantity.ts';
import { renderCommentContent } from './commentContent.tsx';
import GroceriesSectionToggleHeader from './GroceriesSectionToggleHeader.tsx';
import { SectionGroup } from './sectionGrouping.ts';
import { GroceriesListItemDetail } from './types.ts';

interface Props {
  group: SectionGroup<GroceriesListItemDetail>;
  canEdit: boolean;
  onTogglePickedUp: (id: string, pickedUp: boolean) => Promise<void>;
}

function formatItemLabel(item: GroceriesListItemDetail, t: TFunction): string {
  const quantityLabel = formatQuantityUnit(item.quantity, item.unit, item.is_divisible, t);
  return quantityLabel ? `${item.name} — ${quantityLabel}` : item.name;
}

const GroceriesShoppingSectionGroup: React.FC<Props> = ({ group, canEdit, onTogglePickedUp }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ marginBottom: '24px' }}>
      <GroceriesSectionToggleHeader
        icon={group.icon}
        name={group.name}
        count={group.items.length}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        size="lg"
      />
      {expanded && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            columnGap: '20px',
            rowGap: '14px',
            paddingLeft: '24px',
          }}
        >
          {group.items.map((item) => (
            <div
              key={item.id}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: canEdit ? 1 : 0.6, pointerEvents: canEdit ? 'auto' : 'none' }}
            >
              <ThemedCheckbox
                label={formatItemLabel(item, t)}
                checked={item.picked_up}
                onChange={(checked) => onTogglePickedUp(item.id, checked)}
                size="lg"
              />
              {item.comment && (
                <ThemedPopover
                  triggerIcon="info"
                  triggerLabel={t('features.groceries.itemComment')}
                  closeLabel={t('common.close')}
                  triggerIconSize={12}
                >
                  <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.text, maxWidth: '240px' }}>
                    {renderCommentContent(item.comment)}
                  </div>
                </ThemedPopover>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroceriesShoppingSectionGroup;
