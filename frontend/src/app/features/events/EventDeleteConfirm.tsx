import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  eventTitle: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const EventDeleteConfirm: React.FC<Props> = ({ eventTitle, saving, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: '12px', backgroundColor: theme.colors.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '32px' }}>
      <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: theme.colors.text, textAlign: 'center' }}>
        {t('features.events.confirmDelete')}
      </span>
      <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, textAlign: 'center' }}>
        {eventTitle}
      </span>
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <ThemedButton variant="secondary" onClick={onCancel} disabled={saving}>{t('common.cancel')}</ThemedButton>
        <ThemedButton variant="danger" onClick={onConfirm} disabled={saving}>{t('features.events.delete')}</ThemedButton>
      </div>
    </div>
  );
};

export default EventDeleteConfirm;
