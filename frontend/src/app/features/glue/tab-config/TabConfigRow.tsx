import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { ChevronDown, ChevronUp, Unlink } from 'lucide-react';

import {
  DefaultRadio,
  IconButton,
  NameInput,
  ReadOnlyName,
  VisibilityCheckbox,
} from './TabConfigRowControls.tsx';
import { TabWithConfig } from './types.ts';

type Theme = ReturnType<typeof useTheme>['theme'];

function gridTemplateColumns(hasPinnedTabs: boolean): string {
  return `auto 1fr 130px auto auto auto${hasPinnedTabs ? ' auto' : ''}`;
}

export const MoveButtons: React.FC<{
  index: number;
  total: number;
  theme: Theme;
  t: (k: string) => string;
  onMoveUp: () => void;
  onMoveDown: () => void;
}> = ({ index, total, theme, t, onMoveUp, onMoveDown }) => (
  <div style={{ display: 'flex', gap: '2px', width: '56px', justifyContent: 'flex-end' }}>
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
        color: index === total - 1 ? theme.colors.secondary : theme.colors.text,
        borderRadius: '4px',
      }}
      aria-label={t('tabConfig.moveDown')}
    >
      <ChevronDown size={16} />
    </button>
  </div>
);

export const UnpinCell: React.FC<{
  isPinned: boolean;
  theme: Theme;
  t: (k: string) => string;
  onUnpin: () => void;
}> = ({ isPinned, theme, t, onUnpin }) => (
  <span style={{ width: '28px' }}>
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
  </span>
);

export function isNameInvalid(tab: TabWithConfig): boolean {
  return tab.name === '' && !tab.icon;
}

interface TabConfigHeaderProps {
  theme: ReturnType<typeof useTheme>['theme'];
  t: (k: string) => string;
  hasPinnedTabs: boolean;
}

export const TabConfigHeader: React.FC<TabConfigHeaderProps> = ({ theme, t, hasPinnedTabs }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: gridTemplateColumns(hasPinnedTabs),
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
    <span style={{ width: '130px' }}>{t('tabConfig.name')}</span>
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
  onNameChange: (name: string) => void;
  onToggleHidden: () => void;
}

export const TabConfigRow: React.FC<TabConfigRowProps> = ({
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
  onNameChange,
  onToggleHidden,
}) => {
  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: gridTemplateColumns(hasPinnedTabs),
    gap: 'var(--space-sm)',
    alignItems: 'center',
    padding: 'var(--space-xs) var(--space-sm)',
    borderRadius: '6px',
    backgroundColor: tab.visible ? 'transparent' : `${theme.colors.border}40`,
  };

  return (
    <div style={rowStyle}>
      <IconButton tab={tab} theme={theme} t={t} isEditing={isEditingIcon} onToggle={onToggleIconEditor} />
      <ReadOnlyName tab={tab} theme={theme} />
      <NameInput tab={tab} theme={theme} t={t} onNameChange={onNameChange} onToggleHidden={onToggleHidden} />
      <VisibilityCheckbox tab={tab} theme={theme} t={t} onToggle={onToggleVisible} />
      <DefaultRadio tab={tab} theme={theme} t={t} onSetDefault={onSetDefault} />
      <MoveButtons index={index} total={total} theme={theme} t={t} onMoveUp={onMoveUp} onMoveDown={onMoveDown} />
      {hasPinnedTabs && (
        <UnpinCell isPinned={isPinned} theme={theme} t={t} onUnpin={onUnpin} />
      )}
    </div>
  );
};
