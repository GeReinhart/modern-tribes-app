import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { TabWithConfig } from './types.ts';

type Theme = ReturnType<typeof useTheme>['theme'];

export const IconButton: React.FC<{
  tab: TabWithConfig;
  theme: Theme;
  t: (k: string) => string;
  isEditing: boolean;
  onToggle: () => void;
}> = ({ tab, theme, t, isEditing, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    title={t('tabConfig.icon')}
    aria-label={t('tabConfig.icon')}
    style={{
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${isEditing ? theme.colors.primary : theme.colors.border}`,
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
);

export const ColorButton: React.FC<{
  tab: TabWithConfig;
  theme: Theme;
  t: (k: string) => string;
  isEditing: boolean;
  onToggle: () => void;
}> = ({ tab, theme, t, isEditing, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    title={t('tabConfig.color')}
    aria-label={t('tabConfig.color')}
    style={{
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `1px solid ${isEditing ? theme.colors.primary : theme.colors.border}`,
      borderRadius: '8px',
      backgroundColor: 'transparent',
      cursor: 'pointer',
    }}
  >
    <span
      style={{
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        backgroundColor: tab.color ?? theme.colors.primary,
        border: `1px solid ${theme.colors.border}`,
      }}
    />
  </button>
);

export const ReadOnlyName: React.FC<{
  tab: TabWithConfig;
  theme: Theme;
}> = ({ tab, theme }) => (
  <span
    style={{
      color: tab.visible ? theme.colors.text : theme.colors.secondary,
      fontWeight: tab.is_default ? 600 : 400,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}
  >
    {tab.label}
  </span>
);

export const NameInput: React.FC<{
  tab: TabWithConfig;
  theme: Theme;
  t: (k: string) => string;
  onToggleHidden: () => void;
}> = ({ tab, theme, t, onToggleHidden }) => {
  const hidden = tab.name === '';
  const canHide = Boolean(tab.icon);
  const toggleDisabled = !hidden && !canHide;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '56px' }}>
      <input
        type="checkbox"
        checked={!hidden}
        onChange={onToggleHidden}
        disabled={toggleDisabled}
        title={
          toggleDisabled
            ? t('tabConfig.setIconFirst')
            : hidden
              ? t('tabConfig.showName')
              : t('tabConfig.hideName')
        }
        aria-label={hidden ? t('tabConfig.showName') : t('tabConfig.hideName')}
        style={{
          width: '16px',
          height: '16px',
          cursor: toggleDisabled ? 'not-allowed' : 'pointer',
          opacity: toggleDisabled ? 0.4 : 1,
          accentColor: theme.colors.primary,
        }}
      />
    </div>
  );
};
