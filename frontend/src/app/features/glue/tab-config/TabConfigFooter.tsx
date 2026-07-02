import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface TabConfigFooterProps {
  theme: ReturnType<typeof useTheme>['theme'];
  t: (k: string) => string;
  hasInvalidRow: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const TabConfigFooter: React.FC<TabConfigFooterProps> = ({
  theme,
  t,
  hasInvalidRow,
  saving,
  onClose,
  onSave,
}) => (
  <>
    {hasInvalidRow && (
      <span style={{ color: theme.colors.danger, fontSize: 'var(--font-sm)' }}>
        {t('tabConfig.nameOrIconRequired')}
      </span>
    )}
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
        leftIcon={<ThemedSvgIcon name="x" color="currentColor" size={16} />}
      >
        {t('common.cancel')}
      </ThemedButton>
      <ThemedButton
        variant="primary"
        onClick={onSave}
        disabled={saving || hasInvalidRow}
        leftIcon={<ThemedSvgIcon name="save" color="currentColor" size={16} />}
      >
        {saving ? t('common.saving') : t('common.save')}
      </ThemedButton>
    </div>
  </>
);
