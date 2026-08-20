import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import GroceriesListColumnRow from './GroceriesListColumnRow.tsx';
import { groupBySections } from './sectionGrouping.ts';
import { GroceriesListItemDetail, GroceriesSection } from './types.ts';

interface Props {
  items: GroceriesListItemDetail[];
  sections: GroceriesSection[];
  canEdit: boolean;
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  focusItemId: string | null;
  onFocused: () => void;
}

const GroceriesListColumn: React.FC<Props> = ({
  items, sections, canEdit, onUpdateQuantity, onRemove, focusItemId, onFocused,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const groups = groupBySections(items, sections, t('features.groceries.uncategorized'));

  return (
    <div>
      <h3 style={{ margin: '0 0 12px', color: theme.colors.text, fontSize: 'var(--font-md)' }}>
        {t('features.groceries.myList')}
      </h3>

      {items.length === 0 && (
        <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
          {t('features.groceries.noItems')}
        </span>
      )}

      {groups.map((group) => (
        <div key={group.id ?? 'uncategorized'} style={{ marginBottom: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              color: theme.colors.secondary,
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            {group.icon && <ThemedSvgIcon name={group.icon as IconName} color={theme.colors.secondary} size={14} />}
            {group.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {group.items.map((item) => (
              <GroceriesListColumnRow
                key={item.id}
                item={item}
                canEdit={canEdit}
                autoFocus={focusItemId === item.id}
                onFocused={onFocused}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroceriesListColumn;
