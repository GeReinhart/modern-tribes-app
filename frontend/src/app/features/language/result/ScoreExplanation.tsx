import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

const EXPLANATION_KEYS = [
  'features.language.scoreExplanationOverall',
  'features.language.scoreExplanationPoints',
  'features.language.scoreExplanationDays',
  'features.language.scoreExplanationChoice',
  'features.language.scoreExplanationDecay',
] as const;

// A collapsed-by-default text explaining how the results are calculated.
const ScoreExplanation: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <details style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-md)', padding: '6px 10px' }}>
      <summary style={{ cursor: 'pointer', fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
        {t('features.language.scoreExplanationTitle')}
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
        {EXPLANATION_KEYS.map((key) => <ThemedText key={key} size="small">{t(key)}</ThemedText>)}
      </div>
    </details>
  );
};

export default ScoreExplanation;
