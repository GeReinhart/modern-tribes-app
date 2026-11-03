import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

// Content of the discreet row triggering the online search: the icon of the "suggest a
// translation" button, in the accent color, with a tooltip asking not to overuse it.
const OnlineSearchRow: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <span
      title={t('features.language.searchOnlineTooltip')}
      aria-label={t('features.language.searchOnline')}
      style={{ display: 'inline-flex' }}
    >
      <ThemedSvgIcon name="zap" color={theme.colors.accent} size={16} />
    </span>
  );
};

export default OnlineSearchRow;
