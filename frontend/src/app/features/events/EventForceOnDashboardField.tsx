import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  value: boolean;
  canEdit: boolean;
  onChange: (v: boolean) => void;
}

const EventForceOnDashboardField: React.FC<Props> = ({ value, canEdit, onChange }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (canEdit) {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: theme.colors.primary, cursor: 'pointer' }}
        />
        <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.text, fontWeight: 600 }}>
          {t('common.forceOnDashboard')}
        </span>
      </label>
    );
  }

  if (!value) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-xs)', color: theme.colors.primary, fontWeight: 600 }}>
      <span>📌</span>
      <span>{t('common.forceOnDashboard')}</span>
    </div>
  );
};

export default EventForceOnDashboardField;
