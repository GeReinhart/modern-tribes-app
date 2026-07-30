import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

import { isNameInvalid } from './TabConfigRow.tsx';
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
  onNameChange: (name: string) => void;
  onToggleHidden: () => void;
}> = ({ tab, theme, t, onNameChange, onToggleHidden }) => {
  const invalid = isNameInvalid(tab);
  const hidden = tab.name === '';
  const canHide = Boolean(tab.icon);
  const toggleDisabled = !hidden && !canHide;
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '130px' }}>
      <input
        type="text"
        value={hidden ? '' : tab.name ?? ''}
        disabled={hidden}
        onChange={(e) => onNameChange(e.target.value)}
        aria-label={t('tabConfig.name')}
        title={invalid ? t('tabConfig.nameOrIconRequired') : undefined}
        style={{
          width: '100%',
          minWidth: 0,
          padding: '4px 26px 4px 8px',
          border: `1px solid ${invalid ? theme.colors.danger : theme.colors.border}`,
          borderRadius: '6px',
          fontSize: 'var(--font-sm)',
          color: theme.colors.text,
          backgroundColor: hidden ? `${theme.colors.border}30` : 'transparent',
          outline: 'none',
          opacity: hidden ? 0.6 : 1,
        }}
      />
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
          position: 'absolute',
          right: '6px',
          width: '14px',
          height: '14px',
          cursor: toggleDisabled ? 'not-allowed' : 'pointer',
          opacity: toggleDisabled ? 0.4 : 1,
          accentColor: theme.colors.primary,
        }}
      />
    </div>
  );
};

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
