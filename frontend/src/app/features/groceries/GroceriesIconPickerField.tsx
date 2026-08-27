import { IconSectionPicker } from '@/app/platform/core/layout/themes/components/IconSectionPicker.tsx';
import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  value: string | null;
  onChange: (icon: string | null) => void;
}

const GroceriesIconPickerField: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(!!value);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          fontSize: 'var(--font-sm)',
          fontWeight: 500,
          color: theme.colors.text,
          marginBottom: expanded ? '8px' : 0,
        }}
      >
        <ThemedSvgIcon name={expanded ? 'chevron-down' : 'chevron-up'} color={theme.colors.secondary} size={12} />
        {value && <ThemedSvgIcon name={value as IconName} color={theme.colors.text} size={16} />}
        {t('features.groceries.iconLabel')}
      </button>
      {expanded && (
        <IconSectionPicker value={value} onChange={onChange} defaultOpenSection="groceries" />
      )}
    </div>
  );
};

export default GroceriesIconPickerField;
