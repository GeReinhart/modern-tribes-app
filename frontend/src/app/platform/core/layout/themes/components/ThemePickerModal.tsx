import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { ThemeCodeSelect } from '@/app/platform/core/layout/themes/components/ThemeCodeSelect.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ThemePickerModalProps {
  title: string;
  currentThemeCode: string | null | undefined;
  onSave: (themeCode: string | null) => Promise<void>;
  onClose: () => void;
}

export const ThemePickerModal: React.FC<ThemePickerModalProps> = ({
  title,
  currentThemeCode,
  onSave,
  onClose,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [value, setValue] = useState<string | null>(currentThemeCode ?? null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(value);
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '12px',
          padding: '24px',
          width: '380px',
          maxWidth: '90vw',
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <ThemedText size="medium" as="h3" style={{ marginBottom: '20px' }}>
          {title}
        </ThemedText>
        <div style={{ marginBottom: '20px' }}>
          <ThemeCodeSelect
            label={t('theme.selectTheme')}
            value={value}
            onChange={setValue}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <ThemedButton
            variant="ghost"
            type="button"
            onClick={onClose}
            disabled={saving}
            leftIcon={<ThemedSvgIcon name="x" color="currentColor" size={16} />}
          >
            {t('common.cancel')}
          </ThemedButton>
          <ThemedButton
            variant="primary"
            type="button"
            onClick={handleSave}
            isLoading={saving}
            disabled={saving}
            leftIcon={<ThemedSvgIcon name="save" color="currentColor" size={16} />}
          >
            {t('common.save')}
          </ThemedButton>
        </div>
      </div>
    </div>
  );
};
