import { ColorSwatchPicker } from '@/app/platform/core/layout/themes/components/ColorSwatchPicker.tsx';
import { IconSectionPicker } from '@/app/platform/core/layout/themes/components/IconSectionPicker.tsx';
import { ThemedModal, ThemedModalBody } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FieldRow } from './FieldRow.tsx';
import {
  DefaultRadio,
  MoveButtons,
  UnpinButton,
  VisibilityCheckbox,
} from './TabConfigActionControls.tsx';
import { ColorButton, IconButton, NameInput, ReadOnlyName } from './TabConfigRowControls.tsx';
import {
  moveTab,
  setColor,
  setDefault,
  setIcon,
  toggleNameHidden,
  toggleVisible,
} from './tabConfigMutations.ts';
import { TabWithConfig } from './types.ts';

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#6b7280', '#10b981',
];

interface TabEditPopupProps {
  tabKey: string;
  tabsWithConfig: TabWithConfig[];
  isPinned: boolean;
  onSave: (updated: TabWithConfig[]) => Promise<void>;
  onUnpin?: () => Promise<void>;
  onClose: () => void;
}

export const TabEditPopup: React.FC<TabEditPopupProps> = ({
  tabKey,
  tabsWithConfig,
  isPinned,
  onSave,
  onUnpin,
  onClose,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [editingField, setEditingField] = useState<'icon' | 'color' | null>(null);

  const tab = tabsWithConfig.find((tb) => tb.key === tabKey);
  const index = tabsWithConfig.findIndex((tb) => tb.key === tabKey);

  if (!tab) return null;

  const toggleEditingField = (field: 'icon' | 'color') =>
    setEditingField((prev) => (prev === field ? null : field));

  const handleUnpin = async () => {
    if (!onUnpin) return;
    await onUnpin();
    onClose();
  };

  return (
    <ThemedModal isOpen title={tab.label || t('tabConfig.tab')} onClose={onClose} size="sm">
      <ThemedModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <FieldRow label={t('tabConfig.icon')}>
            <IconButton tab={tab} theme={theme} t={t} isEditing={editingField === 'icon'} onToggle={() => toggleEditingField('icon')} />
          </FieldRow>
          {editingField === 'icon' && (
            <IconSectionPicker
              value={tab.icon}
              defaultOpenSection="general"
              onChange={(icon) => {
                onSave(setIcon(tabsWithConfig, tab.key, icon));
                setEditingField(null);
              }}
            />
          )}

          <FieldRow label={t('tabConfig.color')}>
            <ColorButton tab={tab} theme={theme} t={t} isEditing={editingField === 'color'} onToggle={() => toggleEditingField('color')} />
          </FieldRow>
          {editingField === 'color' && (
            <ColorSwatchPicker
              colors={COLOR_PALETTE}
              value={tab.color ?? theme.colors.primary}
              onChange={(color) => {
                onSave(setColor(tabsWithConfig, tab.key, color));
                setEditingField(null);
              }}
            />
          )}

          <FieldRow label={t('tabConfig.name')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <ReadOnlyName tab={tab} theme={theme} />
              <NameInput tab={tab} theme={theme} t={t} onToggleHidden={() => onSave(toggleNameHidden(tabsWithConfig, tab.key))} />
            </div>
          </FieldRow>

          <FieldRow label={t('tabConfig.visible')}>
            <VisibilityCheckbox tab={tab} theme={theme} t={t} onToggle={() => onSave(toggleVisible(tabsWithConfig, tab.key))} />
          </FieldRow>

          <FieldRow label={t('tabConfig.default')}>
            <DefaultRadio tab={tab} theme={theme} t={t} onSetDefault={() => onSave(setDefault(tabsWithConfig, tab.key))} />
          </FieldRow>

          <FieldRow label={t('tabConfig.order')}>
            <MoveButtons
              canMoveBefore={index > 0}
              canMoveAfter={index < tabsWithConfig.length - 1}
              theme={theme}
              t={t}
              onMoveBefore={() => onSave(moveTab(tabsWithConfig, tab.key, -1))}
              onMoveAfter={() => onSave(moveTab(tabsWithConfig, tab.key, 1))}
            />
          </FieldRow>

          {isPinned && onUnpin && <UnpinButton theme={theme} t={t} onUnpin={handleUnpin} />}
        </div>
      </ThemedModalBody>
    </ThemedModal>
  );
};
