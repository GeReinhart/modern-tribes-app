import { ThemedCheckbox } from '@/app/platform/core/layout/themes/components/ThemedCheckbox.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useResponsiveContext } from '@/app/platform/core/responsive/ResponsiveContext.tsx';

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

const SINGLE_COLUMN_BREAKPOINT_PX = 800;

function formatItemLabel(item: GroceriesListItemDetail, t: TFunction): string {
  const quantityLabel = formatQuantityUnit(item.quantity, item.unit, item.is_divisible, t);
  return quantityLabel ? `${item.name} — ${quantityLabel}` : item.name;
}

const GroceriesShoppingSectionGroup: React.FC<Props> = ({ group, canEdit, onTogglePickedUp }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { windowWidth } = useResponsiveContext();
  const [expanded, setExpanded] = useState(true);
  const [openCommentIds, setOpenCommentIds] = useState<Set<string>>(new Set());
  const gridTemplateColumns = windowWidth < SINGLE_COLUMN_BREAKPOINT_PX ? '1fr' : 'repeat(2, 1fr)';

  const toggleComment = (itemId: string): void => {
    setOpenCommentIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

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
            gridTemplateColumns,
            columnGap: '20px',
            rowGap: '14px',
            paddingLeft: '24px',
          }}
        >
          {group.items.map((item) => (
            <div
              key={item.id}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px', opacity: canEdit ? 1 : 0.6, pointerEvents: canEdit ? 'auto' : 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ThemedCheckbox
                  label={formatItemLabel(item, t)}
                  checked={item.picked_up}
                  onChange={(checked) => onTogglePickedUp(item.id, checked)}
                  size="lg"
                />
                {item.comment && (
                  <button
                    type="button"
                    onClick={() => toggleComment(item.id)}
                    aria-label={t('features.groceries.itemComment')}
                    title={t('features.groceries.itemComment')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: theme.colors.surface, border: `1px solid ${theme.colors.border}`,
                      borderRadius: '50%', cursor: 'pointer', padding: '3px', boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    <ThemedSvgIcon name="info" color={theme.colors.text} size={12} />
                  </button>
                )}
              </div>
              {item.comment && openCommentIds.has(item.id) && (
                <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.text, paddingLeft: '20px' }}>
                  {renderCommentContent(item.comment)}
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
