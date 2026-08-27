import { ICON_NAMES } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ICON_SECTIONS, IconSectionKey } from '@/app/platform/core/layout/themes/icons/iconSections.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IconGridButton } from './IconGridButton.tsx';
import { IconSectionGroup } from './IconSectionGroup.tsx';

interface IconSectionPickerProps {
  value: string | null | undefined;
  onChange: (icon: string | null) => void;
  defaultOpenSection?: IconSectionKey;
}

export const IconSectionPicker: React.FC<IconSectionPickerProps> = ({
  value,
  onChange,
  defaultOpenSection = 'general',
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [openSections, setOpenSections] = useState<Set<IconSectionKey>>(new Set([defaultOpenSection]));
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    setOpenSections((prev) => new Set(prev).add(defaultOpenSection));
  }, [defaultOpenSection]);

  const toggleSection = (key: IconSectionKey) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const trimmedSearch = searchText.trim().toLowerCase();
  const searchResults = trimmedSearch ? ICON_NAMES.filter((name) => name.includes(trimmedSearch)) : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        padding: 'var(--space-sm)',
        maxHeight: '300px',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder={t('iconPicker.searchPlaceholder')}
          style={{
            flex: 1,
            padding: '4px 8px',
            borderRadius: '6px',
            border: `1px solid ${theme.colors.border}`,
            fontSize: 'var(--font-sm)',
            color: theme.colors.text,
            backgroundColor: theme.colors.surface,
          }}
        />
        <button
          type="button"
          onClick={() => onChange(null)}
          title={t('common.none')}
          style={{
            padding: '4px 8px',
            borderRadius: '6px',
            border: `1px solid ${!value ? theme.colors.primary : theme.colors.border}`,
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 'var(--font-xs)',
            color: theme.colors.secondary,
          }}
        >
          {t('common.none')}
        </button>
      </div>

      {searchResults ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {searchResults.length === 0 ? (
            <span style={{ color: theme.colors.secondary, fontSize: 'var(--font-sm)' }}>
              {t('iconPicker.noResults')}
            </span>
          ) : (
            searchResults.map((icon) => (
              <IconGridButton key={icon} icon={icon} selected={value === icon} onClick={() => onChange(icon)} />
            ))
          )}
        </div>
      ) : (
        ICON_SECTIONS.map((section) => (
          <IconSectionGroup
            key={section.key}
            section={section}
            isOpen={openSections.has(section.key)}
            value={value}
            onToggle={() => toggleSection(section.key)}
            onSelect={(icon) => onChange(icon)}
          />
        ))
      )}
    </div>
  );
};
