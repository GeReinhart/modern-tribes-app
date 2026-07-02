import { IconPicker } from '@/app/platform/core/layout/themes/components/IconPicker.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TabConfigFooter } from './TabConfigFooter.tsx';
import { isNameInvalid, TabConfigHeader, TabConfigRow } from './TabConfigRow.tsx';
import { TabWithConfig } from './types.ts';

interface TabConfigPopupProps {
  tabsWithConfig: TabWithConfig[];
  onSave: (updated: TabWithConfig[]) => Promise<void>;
  onClose: () => void;
  pinnedTabKeys?: Set<string>;
  onUnpinTab?: (key: string) => Promise<void>;
}

function moveTab(
  tabs: TabWithConfig[],
  index: number,
  direction: -1 | 1,
): TabWithConfig[] {
  const next = index + direction;
  if (next < 0 || next >= tabs.length) return tabs;
  const updated = [...tabs];
  [updated[index], updated[next]] = [updated[next], updated[index]];
  return updated.map((t, i) => ({ ...t, order: i }));
}

function toggleVisible(tabs: TabWithConfig[], key: string): TabWithConfig[] {
  const updated = tabs.map((t) =>
    t.key === key ? { ...t, visible: !t.visible } : t,
  );
  const hasDefault = updated.some((t) => t.is_default && t.visible);
  if (!hasDefault) {
    const first = updated.find((t) => t.visible);
    return updated.map((t) => ({
      ...t,
      is_default: first ? t.key === first.key : t.is_default,
    }));
  }
  return updated;
}

function setDefault(tabs: TabWithConfig[], key: string): TabWithConfig[] {
  return tabs.map((t) => ({ ...t, is_default: t.key === key }));
}

function setIcon(tabs: TabWithConfig[], key: string, icon: string | null): TabWithConfig[] {
  return tabs.map((t) => (t.key === key ? { ...t, icon } : t));
}

function setName(tabs: TabWithConfig[], key: string, name: string): TabWithConfig[] {
  return tabs.map((t) => (t.key === key ? { ...t, name: name === '' ? undefined : name } : t));
}

function toggleNameHidden(tabs: TabWithConfig[], key: string): TabWithConfig[] {
  return tabs.map((t) => (t.key === key ? { ...t, name: t.name === '' ? undefined : '' } : t));
}

export const TabConfigPopup: React.FC<TabConfigPopupProps> = ({
  tabsWithConfig,
  onSave,
  onClose,
  pinnedTabKeys,
  onUnpinTab,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [draft, setDraft] = useState<TabWithConfig[]>(tabsWithConfig);
  const [saving, setSaving] = useState(false);
  const [editingIconKey, setEditingIconKey] = useState<string | null>(null);

  const hasInvalidRow = draft.some(isNameInvalid);

  const handleUnpin = async (key: string) => {
    if (!onUnpinTab) return;
    await onUnpinTab(key);
    setDraft((prev) => prev.filter((tab) => tab.key !== key));
  };

  const handleSave = async () => {
    if (hasInvalidRow) return;
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme.colors.surface,
          border: `2px solid ${theme.colors.border}`,
          borderRadius: '12px',
          padding: 'var(--space-xl)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
          width: '620px',
          maxWidth: '95vw',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 700,
            color: theme.colors.text,
          }}
        >
          {t('tabConfig.title')}
        </span>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
          }}
        >
          <TabConfigHeader theme={theme} t={t} hasPinnedTabs={(pinnedTabKeys?.size ?? 0) > 0} />
          {draft.map((tab, index) => (
            <React.Fragment key={tab.key}>
              <TabConfigRow
                tab={tab}
                index={index}
                total={draft.length}
                theme={theme}
                t={t}
                isPinned={pinnedTabKeys?.has(tab.key) ?? false}
                hasPinnedTabs={(pinnedTabKeys?.size ?? 0) > 0}
                isEditingIcon={editingIconKey === tab.key}
                onMoveUp={() => setDraft((prev) => moveTab(prev, index, -1))}
                onMoveDown={() => setDraft((prev) => moveTab(prev, index, 1))}
                onToggleVisible={() =>
                  setDraft((prev) => toggleVisible(prev, tab.key))
                }
                onSetDefault={() => setDraft((prev) => setDefault(prev, tab.key))}
                onUnpin={() => handleUnpin(tab.key)}
                onToggleIconEditor={() =>
                  setEditingIconKey((prev) => (prev === tab.key ? null : tab.key))
                }
                onNameChange={(name) => setDraft((prev) => setName(prev, tab.key, name))}
                onToggleHidden={() => setDraft((prev) => toggleNameHidden(prev, tab.key))}
              />
              {editingIconKey === tab.key && (
                <IconPicker
                  value={tab.icon}
                  onChange={(icon) => {
                    setDraft((prev) => setIcon(prev, tab.key, icon));
                    setEditingIconKey(null);
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <TabConfigFooter
          theme={theme}
          t={t}
          hasInvalidRow={hasInvalidRow}
          saving={saving}
          onClose={onClose}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};
