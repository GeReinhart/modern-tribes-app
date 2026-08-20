import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatUnitSuffix } from './formatQuantity.ts';
import { SectionGroup } from './sectionGrouping.ts';
import { GroceriesItem } from './types.ts';

interface Props {
  group: SectionGroup<GroceriesItem>;
  canEdit: boolean;
  onAddItem: (itemId: string) => Promise<void>;
  onAddNewItem?: () => void;
  onRenameSection?: () => void;
  onDeleteSection?: () => void;
  onManageItem: (item: GroceriesItem) => void;
}

const GroceriesCatalogSectionGroup: React.FC<Props> = ({
  group, canEdit, onAddItem, onAddNewItem, onRenameSection, onDeleteSection, onManageItem,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(true);
  const isRealSection = group.id !== null;

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
            fontSize: 'var(--font-xs)',
            fontWeight: 700,
            color: theme.colors.secondary,
            textTransform: 'uppercase',
          }}
        >
          <ThemedSvgIcon name={expanded ? 'chevron-down' : 'chevron-up'} color={theme.colors.secondary} size={12} />
          {group.icon && <ThemedSvgIcon name={group.icon as IconName} color={theme.colors.secondary} size={14} />}
          {group.name}
          <span style={{ fontWeight: 500 }}>({group.items.length})</span>
        </button>
        {canEdit && isRealSection && (
          <div style={{ display: 'flex', gap: '4px' }}>
            {onRenameSection && (
              <button
                type="button"
                onClick={onRenameSection}
                title={t('features.groceries.renameSection')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.secondary, display: 'flex' }}
              >
                <ThemedSvgIcon name="pencil" color="currentColor" size={14} />
              </button>
            )}
            {onDeleteSection && (
              <button
                type="button"
                onClick={onDeleteSection}
                title={t('features.groceries.deleteSection')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.danger, display: 'flex' }}
              >
                <ThemedSvgIcon name="trash" color="currentColor" size={14} />
              </button>
            )}
            {onAddNewItem && (
              <button
                type="button"
                onClick={onAddNewItem}
                title={t('features.groceries.addItemToSection')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.primary, display: 'flex' }}
              >
                <ThemedSvgIcon name="plus" color="currentColor" size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {group.items.map((item) => (
            <div
              key={item.id}
              onClick={canEdit ? () => onAddItem(item.id) : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderRadius: '6px',
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.surface,
                cursor: canEdit ? 'pointer' : 'default',
                fontSize: 'var(--font-sm)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {item.icon && <ThemedSvgIcon name={item.icon as IconName} color={theme.colors.text} size={14} />}
                <span style={{ color: theme.colors.text }}>{item.name}</span>
                {formatUnitSuffix(item.unit) && (
                  <span style={{ color: theme.colors.secondary, fontSize: 'var(--font-xs)' }}>
                    {formatUnitSuffix(item.unit)}
                  </span>
                )}
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageItem(item);
                  }}
                  title={t('features.groceries.manageItem')}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.secondary, display: 'flex' }}
                >
                  <ThemedSvgIcon name="settings" color="currentColor" size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroceriesCatalogSectionGroup;
