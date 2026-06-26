import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React from 'react';

interface Props {
  cents: number | null;
}

const WIDTH = 320;
const HEIGHT = 90;
const RANGE = 50;
const TRACK_Y = HEIGHT - 24;
const LEFT = 24;
const RIGHT = WIDTH - 24;

const TunerMeter: React.FC<Props> = ({ cents }) => {
  const { theme } = useTheme();
  const clamped = cents !== null ? Math.max(-RANGE, Math.min(RANGE, cents)) : null;
  const needleX = clamped !== null ? (LEFT + RIGHT) / 2 + (clamped / RANGE) * ((RIGHT - LEFT) / 2) : (LEFT + RIGHT) / 2;
  const inTune = cents !== null && Math.abs(cents) <= 5;
  const needleColor = inTune ? theme.colors.primary : theme.colors.text;

  return (
    <svg width={WIDTH} height={HEIGHT} style={{ display: 'block' }}>
      <text x={LEFT} y={TRACK_Y - 8} textAnchor="middle" fontSize="11" fill={theme.colors.ghost}>FLAT</text>
      <text x={RIGHT} y={TRACK_Y - 8} textAnchor="middle" fontSize="11" fill={theme.colors.ghost}>SHARP</text>
      <line x1={LEFT} y1={TRACK_Y} x2={RIGHT} y2={TRACK_Y} stroke={theme.colors.ghost} strokeWidth={4} strokeLinecap="round" />
      <line x1={(LEFT + RIGHT) / 2} y1={TRACK_Y - 10} x2={(LEFT + RIGHT) / 2} y2={TRACK_Y + 2} stroke={theme.colors.primary} strokeWidth={2} />
      {[-40, -20, 20, 40].map(tick => {
        const x = (LEFT + RIGHT) / 2 + (tick / RANGE) * ((RIGHT - LEFT) / 2);
        return <line key={tick} x1={x} y1={TRACK_Y - 6} x2={x} y2={TRACK_Y + 2} stroke={theme.colors.ghost} strokeWidth={1} />;
      })}
      {clamped !== null && (
        <>
          <line x1={needleX} y1={12} x2={(LEFT + RIGHT) / 2} y2={TRACK_Y} stroke={needleColor} strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={needleX} cy={10} r={6} fill={needleColor} />
        </>
      )}
    </svg>
  );
};

export default TunerMeter;
