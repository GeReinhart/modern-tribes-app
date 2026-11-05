import { CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

// The configuration shared by the results charts (Recharts): a real time axis, a dashed grid, a tooltip.
export const CHART_HEIGHT = 200;
export const CHART_MARGIN = { top: 10, right: 12, bottom: 0, left: 0 };

const DAY_MS = 86_400_000;

export interface ChartColors {
  secondary: string;
  border: string;
}

export const dayTimestamp = (isoDate: string): number => Date.parse(`${isoDate}T00:00:00Z`);
const formatDay = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 10);
export const formatPercent = (ratio: number): string => `${(ratio * 100).toFixed(1)}%`;

const tick = (colors: ChartColors) => ({ fontSize: 10, fill: colors.secondary });

export const gridElement = (colors: ChartColors) => (
  <CartesianGrid key="grid" stroke={colors.border} strokeDasharray="3 3" vertical={false} />
);

// The horizontal axis, placing each day at its real position in time.
export const timeAxisElement = (colors: ChartColors, padded = false) => (
  <XAxis
    key="x"
    dataKey="t"
    type="number"
    scale="time"
    domain={['dataMin', 'dataMax']}
    padding={padded ? { left: DAY_MS / 2, right: DAY_MS / 2 } : undefined}
    tickFormatter={formatDay}
    tick={tick(colors)}
    stroke={colors.border}
    minTickGap={40}
  />
);

export const valueAxisElement = (colors: ChartColors, tickFormatter?: (value: number) => string, domain?: [number, number | string]) => (
  <YAxis key="y" width={40} tick={tick(colors)} stroke={colors.border} tickFormatter={tickFormatter} domain={domain} />
);

export const tooltipElement = (formatter: (value: number, name: string) => [string, string]) => (
  <Tooltip key="tooltip" labelFormatter={(label) => formatDay(Number(label))} formatter={(value, name) => formatter(Number(value), String(name))} />
);
