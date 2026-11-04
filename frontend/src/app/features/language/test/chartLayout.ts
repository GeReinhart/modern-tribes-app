// The geometry shared by the results charts (an SVG scaled to the available width).
export const WIDTH = 600;
export const HEIGHT = 180;
export const PAD = { left: 36, right: 12, top: 10, bottom: 22 };

const PLOT_WIDTH = WIDTH - PAD.left - PAD.right;
const PLOT_HEIGHT = HEIGHT - PAD.top - PAD.bottom;

export const xForIndex = (index: number, count: number) =>
  PAD.left + (count <= 1 ? PLOT_WIDTH / 2 : (index / (count - 1)) * PLOT_WIDTH);

// `ratio` goes from 0 (bottom of the plot) to 1 (top).
export const yForRatio = (ratio: number) => PAD.top + (1 - ratio) * PLOT_HEIGHT;

export const plotWidth = () => PLOT_WIDTH;
export const plotHeight = () => PLOT_HEIGHT;

const DAY_MS = 86_400_000;
const dayNumber = (isoDate: string) => Date.parse(`${isoDate}T00:00:00Z`) / DAY_MS;

// A date's horizontal position on an axis running from `firstDate` to `lastDate` (ISO dates).
export const xForDate = (date: string, firstDate: string, lastDate: string) => {
  const span = dayNumber(lastDate) - dayNumber(firstDate);
  return PAD.left + (span <= 0 ? PLOT_WIDTH / 2 : ((dayNumber(date) - dayNumber(firstDate)) / span) * PLOT_WIDTH);
};
