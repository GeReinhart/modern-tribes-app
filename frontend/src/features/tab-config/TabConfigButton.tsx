import { useTheme } from '@/platform/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Settings } from 'lucide-react';

interface TabConfigButtonProps {
  onClick: () => void;
}

export const TabConfigButton: React.FC<TabConfigButtonProps> = ({
  onClick,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      title={t('tabConfig.configure')}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: theme.colors.secondary,
        display: 'flex',
        alignItems: 'center',
        padding: '4px',
      }}
    >
      <Settings size={16} />
    </button>
  );
};
