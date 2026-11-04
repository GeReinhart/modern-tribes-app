import React from 'react';
import { useTranslation } from 'react-i18next';

import { CORRECT_COLOR, WRONG_COLOR } from './attemptColors.ts';
import ChartGrid from './ChartGrid.tsx';
import { HEIGHT, plotHeight, plotWidth, PAD, WIDTH, xForIndex, yForRatio } from './chartLayout.ts';
import PeriodChartFrame from './PeriodChartFrame.tsx';
import { EffortDay } from './types.ts';

interface Props {
  days: EffortDay[];
}

const BAR_GAP = 2;
const round = (value: number) => Number(value.toFixed(1));

// One bar per day, split between the successes (bottom) and the errors (top), both weighted by importance.
const EffortChart: React.FC<Props> = ({ days }) => {
  const { t } = useTranslation();

  return (
    <PeriodChartFrame items={days}>
      {(visible) => {
        const max = Math.max(1, ...visible.map((d) => d.success + d.errors));
        const levels = [0, 0.5, 1].map((ratio) => ({ ratio, label: String(round(max * ratio)) }));
        const barWidth = Math.max(1, plotWidth() / visible.length - BAR_GAP);
        return (
          <>
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={t('features.language.effortOverTime')} style={{ width: '100%', height: 'auto' }}>
              <ChartGrid levels={levels} firstDate={visible[0].date} lastDate={visible[visible.length - 1].date} />
              {visible.map((day, i) => (
                <EffortBar key={day.date} day={day} max={max} x={xForIndex(i, visible.length) - barWidth / 2} width={barWidth} />
              ))}
            </svg>
            <Legend />
          </>
        );
      }}
    </PeriodChartFrame>
  );
};

const EffortBar: React.FC<{ day: EffortDay; max: number; x: number; width: number }> = ({ day, max, x, width }) => {
  const { t } = useTranslation();
  const successHeight = (day.success / max) * plotHeight();
  const errorsHeight = (day.errors / max) * plotHeight();
  const baseline = yForRatio(0);
  const title = `${day.date} — ${t('features.language.effortSuccess')}: ${round(day.success)}, ${t('features.language.effortErrors')}: ${round(day.errors)}`;

  return (
    <g>
      <rect x={x} y={baseline - successHeight} width={width} height={successHeight} fill={CORRECT_COLOR} />
      <rect x={x} y={baseline - successHeight - errorsHeight} width={width} height={errorsHeight} fill={WRONG_COLOR} />
      <rect x={x} y={PAD.top} width={width} height={plotHeight()} fill="transparent"><title>{title}</title></rect>
    </g>
  );
};

const Legend: React.FC = () => {
  const { t } = useTranslation();
  const items = [
    { color: CORRECT_COLOR, label: t('features.language.effortSuccess') },
    { color: WRONG_COLOR, label: t('features.language.effortErrors') },
  ];

  return (
    <div style={{ display: 'flex', gap: '12px', fontSize: 'var(--font-sm)' }}>
      {items.map(({ color, label }) => (
        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
          {label}
        </span>
      ))}
    </div>
  );
};

export default EffortChart;
