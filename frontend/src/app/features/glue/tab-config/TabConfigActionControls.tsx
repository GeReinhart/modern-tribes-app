import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { ChevronDown, ChevronUp, Unlink } from 'lucide-react';

import { TabWithConfig } from './types.ts';

type Theme = ReturnType<typeof useTheme>['theme'];

export const VisibilityCheckbox: React.FC<{
  tab: TabWithConfig;
  theme: Theme;
  t: (k: string) => string;
  onToggle: () => void;
}> = ({ tab, theme, t, onToggle }) => (
  <div style={{ display: 'flex', justifyContent: 'center', width: '72px' }}>
    <input
      type="checkbox"
      checked={tab.visible}
      onChange={onToggle}
      aria-label={t('tabConfig.toggleVisibility')}
      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: theme.colors.primary }}
    />
  </div>
);

export const DefaultRadio: React.FC<{
  tab: TabWithConfig;
  theme: Theme;
  t: (k: string) => string;
  onSetDefault: () => void;
}> = ({ tab, theme, t, onSetDefault }) => (
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
);

export const MoveButtons: React.FC<{
  canMoveBefore: boolean;
  canMoveAfter: boolean;
  theme: Theme;
  t: (k: string) => string;
  onMoveBefore: () => void;
  onMoveAfter: () => void;
}> = ({ canMoveBefore, canMoveAfter, theme, t, onMoveBefore, onMoveAfter }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    <button
      onClick={onMoveBefore}
      disabled={!canMoveBefore}
      style={{
        padding: '2px 4px',
        border: 'none',
        background: 'transparent',
        cursor: canMoveBefore ? 'pointer' : 'not-allowed',
        color: canMoveBefore ? theme.colors.text : theme.colors.secondary,
        borderRadius: '4px',
      }}
      aria-label={t('tabConfig.moveUp')}
    >
      <ChevronUp size={16} />
    </button>
    <button
      onClick={onMoveAfter}
      disabled={!canMoveAfter}
      style={{
        padding: '2px 4px',
        border: 'none',
        background: 'transparent',
        cursor: canMoveAfter ? 'pointer' : 'not-allowed',
        color: canMoveAfter ? theme.colors.text : theme.colors.secondary,
        borderRadius: '4px',
      }}
      aria-label={t('tabConfig.moveDown')}
    >
      <ChevronDown size={16} />
    </button>
  </div>
);

export const UnpinButton: React.FC<{
  theme: Theme;
  t: (k: string) => string;
  onUnpin: () => void;
}> = ({ theme, t, onUnpin }) => (
  <button
    onClick={onUnpin}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 10px',
      border: `1px solid ${theme.colors.danger}`,
      background: 'transparent',
      cursor: 'pointer',
      color: theme.colors.danger,
      borderRadius: '6px',
    }}
    title={t('dashboard.pinnedTab.unpin')}
  >
    <Unlink size={16} />
    <span>{t('dashboard.pinnedTab.unpin')}</span>
  </button>
);
