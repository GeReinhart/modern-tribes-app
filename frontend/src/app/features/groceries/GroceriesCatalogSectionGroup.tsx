import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { formatUnitSuffix } from '@/app/platform/core/formatQuantity.ts';
import GroceriesSectionToggleHeader from './GroceriesSectionToggleHeader.tsx';
import { SectionGroup } from './sectionGrouping.ts';
import { GroceriesItem } from './types.ts';

interface Props {
  group: SectionGroup<GroceriesItem>;
  canEdit: boolean;
  onAddItem?: (itemId: string) => Promise<void>;
  onAddNewItem?: () => void;
  onRenameSection?: () => void;
  onDeleteSection?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onManageItem: (item: GroceriesItem) => void;
}

const GroceriesCatalogSectionGroup: React.FC<Props> = ({
  group, canEdit, onAddItem, onAddNewItem, onRenameSection, onDeleteSection, onMoveUp, onMoveDown, onManageItem,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(true);
  const isRealSection = group.id !== null;

  const headerActions = canEdit && isRealSection && (
    <div style={{ display: 'flex', gap: '4px' }}>
      {onMoveUp && (
        <button
          type="button"
          onClick={onMoveUp}
          title={t('features.groceries.moveSectionUp')}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.secondary, display: 'flex' }}
        >
          <ThemedSvgIcon name="arrow-up" color="currentColor" size={14} />
        </button>
      )}
      {onMoveDown && (
        <button
          type="button"
          onClick={onMoveDown}
          title={t('features.groceries.moveSectionDown')}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.secondary, display: 'flex' }}
        >
          <ThemedSvgIcon name="arrow-down" color="currentColor" size={14} />
        </button>
      )}
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
          style={{
            border: 'none',
            background: `${theme.colors.primary}15`,
            borderRadius: '6px',
            cursor: 'pointer',
            color: theme.colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            marginLeft: '8px',
          }}
        >
          <ThemedSvgIcon name="plus" color="currentColor" size={16} />
        </button>
      )}
    </div>
  );

  return (
    <div style={{ marginBottom: '10px' }}>
      <GroceriesSectionToggleHeader
        icon={group.icon}
        name={group.name}
        count={group.items.length}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        actions={headerActions}
      />
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '18px' }}>
          {group.items.map((item) => (
            <div
              key={item.id}
              onClick={canEdit && onAddItem ? () => onAddItem(item.id) : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderRadius: '6px',
                border: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.surface,
                cursor: canEdit && onAddItem ? 'pointer' : 'default',
                fontSize: 'var(--font-sm)',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {item.icon && <ThemedSvgIcon name={item.icon as IconName} color={theme.colors.text} size={14} />}
                <span style={{ color: theme.colors.text }}>{item.name}</span>
                {formatUnitSuffix(item.unit, t) && (
                  <span style={{ color: theme.colors.secondary, fontSize: 'var(--font-xs)' }}>
                    {formatUnitSuffix(item.unit, t)}
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
