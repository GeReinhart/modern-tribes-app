import { ICON_NAMES, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface IconPickerProps {
  value: string | null | undefined;
  onChange: (icon: string | null) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const buttonStyle = (selected: boolean): React.CSSProperties => ({
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${selected ? theme.colors.primary : theme.colors.border}`,
    borderRadius: '8px',
    backgroundColor: selected ? `${theme.colors.primary}20` : 'transparent',
    cursor: 'pointer',
  });

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        padding: '8px',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        maxHeight: '160px',
        overflowY: 'auto',
      }}
    >
      <button
        type="button"
        onClick={() => onChange(null)}
        title={t('common.none')}
        aria-label={t('common.none')}
        style={{ ...buttonStyle(!value), fontSize: 'var(--font-xs)', color: theme.colors.secondary }}
      >
        {t('common.none')}
      </button>
      {ICON_NAMES.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          title={name}
          aria-label={name}
          style={buttonStyle(value === name)}
        >
          <ThemedSvgIcon name={name} color={theme.colors.text} size={16} />
        </button>
      ))}
    </div>
  );
};
