import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { IconPicker } from '@/app/platform/core/layout/themes/components/IconPicker.tsx';
import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChevronDown, ChevronUp, Unlink } from 'lucide-react';

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

  const handleUnpin = async (key: string) => {
    if (!onUnpinTab) return;
    await onUnpinTab(key);
    setDraft((prev) => prev.filter((tab) => tab.key !== key));
  };

  const handleSave = async () => {
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
          width: '480px',
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
              />
              {editingIconKey === tab.key && (
                <IconPicker
                  value={tab.icon}
                  onChange={(icon) => setDraft((prev) => setIcon(prev, tab.key, icon))}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 'var(--space-sm)',
            marginTop: 'var(--space-sm)',
          }}
        >
          <ThemedButton
            variant="ghost"
            onClick={onClose}
            leftIcon={
              <ThemedSvgIcon name="x" color="currentColor" size={16} />
            }
          >
            {t('common.cancel')}
          </ThemedButton>
          <ThemedButton
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            leftIcon={
              <ThemedSvgIcon name="save" color="currentColor" size={16} />
            }
          >
            {saving ? t('common.saving') : t('common.save')}
          </ThemedButton>
        </div>
      </div>
    </div>
  );
};

interface TabConfigHeaderProps {
  theme: ReturnType<typeof useTheme>['theme'];
  t: (k: string) => string;
  hasPinnedTabs: boolean;
}

const TabConfigHeader: React.FC<TabConfigHeaderProps> = ({ theme, t, hasPinnedTabs }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: `auto 1fr auto auto auto${hasPinnedTabs ? ' auto' : ''}`,
      gap: 'var(--space-sm)',
      alignItems: 'center',
      paddingBottom: 'var(--space-xs)',
      borderBottom: `1px solid ${theme.colors.border}`,
      color: theme.colors.secondary,
      fontSize: 'var(--font-sm)',
      fontWeight: 600,
    }}
  >
    <span style={{ width: '32px' }} />
    <span>{t('tabConfig.tab')}</span>
    <span style={{ textAlign: 'center', width: '72px' }}>
      {t('tabConfig.visible')}
    </span>
    <span style={{ textAlign: 'center', width: '64px' }}>
      {t('tabConfig.default')}
    </span>
    <span style={{ width: '56px' }} />
    {hasPinnedTabs && <span style={{ width: '28px' }} />}
  </div>
);

interface TabConfigRowProps {
  tab: TabWithConfig;
  index: number;
  total: number;
  theme: ReturnType<typeof useTheme>['theme'];
  t: (k: string) => string;
  isPinned: boolean;
  hasPinnedTabs: boolean;
  isEditingIcon: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisible: () => void;
  onSetDefault: () => void;
  onUnpin: () => void;
  onToggleIconEditor: () => void;
}

const TabConfigRow: React.FC<TabConfigRowProps> = ({
  tab,
  index,
  total,
  theme,
  t,
  isPinned,
  hasPinnedTabs,
  isEditingIcon,
  onMoveUp,
  onMoveDown,
  onToggleVisible,
  onSetDefault,
  onUnpin,
  onToggleIconEditor,
}) => {
  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `auto 1fr auto auto auto${hasPinnedTabs ? ' auto' : ''}`,
    gap: 'var(--space-sm)',
    alignItems: 'center',
    padding: 'var(--space-xs) var(--space-sm)',
    borderRadius: '6px',
    backgroundColor: tab.visible ? 'transparent' : `${theme.colors.border}40`,
  };

  return (
    <div style={rowStyle}>
      <button
        type="button"
        onClick={onToggleIconEditor}
        title={t('tabConfig.icon')}
        aria-label={t('tabConfig.icon')}
        style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${isEditingIcon ? theme.colors.primary : theme.colors.border}`,
          borderRadius: '8px',
          backgroundColor: 'transparent',
          cursor: 'pointer',
        }}
      >
        {tab.icon ? (
          <ThemedSvgIcon name={tab.icon as IconName} color={theme.colors.text} size={16} />
        ) : (
          <span style={{ color: theme.colors.secondary, fontSize: 'var(--font-xs)' }}>+</span>
        )}
      </button>
      <span
        style={{
          color: tab.visible ? theme.colors.text : theme.colors.secondary,
          fontWeight: tab.is_default ? 600 : 400,
        }}
      >
        {tab.label}
      </span>

      <div style={{ display: 'flex', justifyContent: 'center', width: '72px' }}>
        <input
          type="checkbox"
          checked={tab.visible}
          onChange={onToggleVisible}
          aria-label={t('tabConfig.toggleVisibility')}
          style={{
            width: '16px',
            height: '16px',
            cursor: 'pointer',
            accentColor: theme.colors.primary,
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', width: '64px' }}>
        <input
          type="radio"
          checked={tab.is_default}
          disabled={!tab.visible}
          onChange={onSetDefault}
          aria-label={t('tabConfig.setDefault')}
          style={{
            width: '16px',
            height: '16px',
            cursor: tab.visible ? 'pointer' : 'not-allowed',
            accentColor: theme.colors.primary,
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '2px',
          width: '56px',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          style={{
            padding: '2px 4px',
            border: 'none',
            background: 'transparent',
            cursor: index === 0 ? 'not-allowed' : 'pointer',
            color: index === 0 ? theme.colors.secondary : theme.colors.text,
            borderRadius: '4px',
          }}
          aria-label={t('tabConfig.moveUp')}
        >
          <ChevronUp size={16} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          style={{
            padding: '2px 4px',
            border: 'none',
            background: 'transparent',
            cursor: index === total - 1 ? 'not-allowed' : 'pointer',
            color:
              index === total - 1 ? theme.colors.secondary : theme.colors.text,
            borderRadius: '4px',
          }}
          aria-label={t('tabConfig.moveDown')}
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {isPinned && (
        <button
          onClick={onUnpin}
          style={{
            padding: '2px 4px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: theme.colors.danger,
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title={t('dashboard.pinnedTab.unpin')}
          aria-label={t('dashboard.pinnedTab.unpin')}
        >
          <Unlink size={16} />
        </button>
      )}
    </div>
  );
};
