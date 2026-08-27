import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { IconSection } from '@/app/platform/core/layout/themes/icons/iconSections.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { IconGridButton } from './IconGridButton.tsx';

interface IconSectionGroupProps {
  section: IconSection;
  isOpen: boolean;
  value: string | null | undefined;
  onToggle: () => void;
  onSelect: (icon: string) => void;
}

export const IconSectionGroup: React.FC<IconSectionGroupProps> = ({
  section,
  isOpen,
  value,
  onToggle,
  onSelect,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: '4px 0',
          fontSize: 'var(--font-sm)',
          fontWeight: 600,
          color: theme.colors.text,
        }}
      >
        <ThemedSvgIcon name={isOpen ? 'chevron-down' : 'chevron-up'} color={theme.colors.secondary} size={14} />
        <span>{t(section.labelKey)}</span>
        <span style={{ color: theme.colors.secondary, fontSize: 'var(--font-xs)' }}>
          ({section.icons.length})
        </span>
      </button>
      {isOpen && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '4px 0 8px 20px' }}>
          {section.icons.map((icon) => (
            <IconGridButton key={icon} icon={icon} selected={value === icon} onClick={() => onSelect(icon)} />
          ))}
        </div>
      )}
    </div>
  );
};
