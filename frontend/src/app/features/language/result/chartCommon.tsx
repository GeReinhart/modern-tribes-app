import { CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

// The configuration shared by the results charts (Recharts): a day axis, a dashed grid, a tooltip.
export const CHART_HEIGHT = 200;
export const CHART_MARGIN = { top: 10, right: 12, bottom: 0, left: 0 };

const EDGE_PADDING = 12;

export interface ChartColors {
  secondary: string;
  border: string;
}

// The charts hold one point per consecutive day, so a category axis on the ISO date spaces them evenly.
export const DAY_KEY = 'date';
const shortDay = (isoDate: string): string => isoDate.slice(5);
export const formatPercent = (ratio: number): string => `${(ratio * 100).toFixed(1)}%`;

const tick = (colors: ChartColors) => ({ fontSize: 10, fill: colors.secondary });

export const gridElement = (colors: ChartColors) => (
  <CartesianGrid key="grid" stroke={colors.border} strokeDasharray="3 3" vertical={false} />
);

// The horizontal axis: one tick per day, labelled month-day.
export const dayAxisElement = (colors: ChartColors, padded = false) => (
  <XAxis
    key="x"
    dataKey={DAY_KEY}
    type="category"
    padding={padded ? { left: EDGE_PADDING, right: EDGE_PADDING } : undefined}
    tickFormatter={shortDay}
    tick={tick(colors)}
    stroke={colors.border}
    minTickGap={40}
  />
);

export const valueAxisElement = (colors: ChartColors, tickFormatter?: (value: number) => string, domain?: [number, number | string]) => (
  <YAxis key="y" width={40} tick={tick(colors)} stroke={colors.border} tickFormatter={tickFormatter} domain={domain} />
);

export const tooltipElement = (formatter: (value: number, name: string) => [string, string]) => (
  <Tooltip key="tooltip" labelFormatter={(label) => String(label)} formatter={(value, name) => formatter(Number(value), String(name))} />
);
