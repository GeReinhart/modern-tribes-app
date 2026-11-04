import { ThemedFilterPill } from '@/app/platform/core/layout/themes/components/ThemedFilterPill.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CHART_PERIODS, ChartPeriodKey, itemsInPeriod } from './scoreChartPeriods.ts';

interface Props<T extends { date: string }> {
  items: T[];
  children: (visible: T[]) => React.ReactNode;
}

// The period selector (week, month, 3 months, all) shared by the results charts: it reduces
// `items` to the chosen duration and hands them to `children`, or says there is nothing to show.
function PeriodChartFrame<T extends { date: string }>({ items, children }: Props<T>) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [periodKey, setPeriodKey] = useState<ChartPeriodKey>('all');
  const period = CHART_PERIODS.find((p) => p.key === periodKey) ?? CHART_PERIODS[CHART_PERIODS.length - 1];
  const visible = itemsInPeriod(items, period.days);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {CHART_PERIODS.map((p) => (
          <ThemedFilterPill
            key={p.key}
            label={t(`features.language.chartPeriod.${p.key}`)}
            color={theme.colors.primary}
            active={p.key === periodKey}
            onClick={() => setPeriodKey(p.key)}
          />
        ))}
      </div>
      {visible.length === 0 ? (
        <ThemedText variant="secondary" size="small">{t('features.language.noChartData')}</ThemedText>
      ) : (
        children(visible)
      )}
    </div>
  );
}

export default PeriodChartFrame;
