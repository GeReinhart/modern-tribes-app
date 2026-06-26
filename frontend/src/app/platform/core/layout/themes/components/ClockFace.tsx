import React from 'react';

const CX = 150;
const CY = 150;
const OUTER_R = 110;
const INNER_R = 74;

function coordAt(r: number, index: number): { x: number; y: number } {
  const a = index * (Math.PI / 6);
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
}

// Outer ring: index 0 → 12, index 1 → 1, ..., index 11 → 11
// Inner ring: index 0 → 0 (shown as "00"), index 1 → 13, ..., index 11 → 23
const HOUR_ITEMS = [
  ...Array.from({ length: 12 }, (_, i) => ({ value: i === 0 ? 12 : i, ring: 'outer' as const, index: i })),
  ...Array.from({ length: 12 }, (_, i) => ({ value: i === 0 ? 0 : i + 12, ring: 'inner' as const, index: i })),
];

const MINUTE_ITEMS = Array.from({ length: 12 }, (_, i) => ({
  value: i * 5,
  label: String(i * 5).padStart(2, '0'),
  index: i,
}));

function handEnd(mode: 'hour' | 'minute', hour: number, minute: number): { x: number; y: number } {
  if (mode === 'hour') {
    const isInner = hour === 0 || hour >= 13;
    const r = isInner ? INNER_R : OUTER_R;
    const index = hour === 0 ? 0 : hour <= 12 ? hour % 12 : hour - 12;
    return coordAt(r, index);
  }
  return coordAt(OUTER_R, Math.round(minute / 5) % 12);
}

interface Props {
  mode: 'hour' | 'minute';
  hour: number;
  minute: number;
  onSelect: (value: number) => void;
  primaryColor: string;
  textColor: string;
  secondaryColor: string;
  bgColor?: string;
  size?: number;
}

const ClockFace: React.FC<Props> = ({ mode, hour, minute, onSelect, primaryColor, textColor, secondaryColor: _secondaryColor, size = 260 }) => {
  const hand = handEnd(mode, hour, minute);
  const selectedMinute = (Math.round(minute / 5) * 5) % 60;

  const hourItems = HOUR_ITEMS.map((item) => {
    const r = item.ring === 'outer' ? OUTER_R : INNER_R;
    const { x, y } = coordAt(r, item.index);
    return { ...item, x, y, selected: mode === 'hour' && item.value === hour };
  });

  const minuteItems = MINUTE_ITEMS.map((item) => {
    const { x, y } = coordAt(OUTER_R, item.index);
    return { ...item, x, y, selected: mode === 'minute' && item.value === selectedMinute };
  });

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = 300 / rect.width;
    const x = (e.clientX - rect.left) * scale;
    const y = (e.clientY - rect.top) * scale;
    const items = mode === 'hour' ? hourItems : minuteItems;
    let nearest = items[0];
    let minDist = Infinity;
    for (const item of items) {
      const d = Math.hypot(item.x - x, item.y - y);
      if (d < minDist) { minDist = d; nearest = item; }
    }
    onSelect(nearest.value);
  };

  return (
    <svg viewBox="0 0 300 300" onClick={handleClick} style={{ cursor: 'pointer', display: 'block', width: '100%', maxWidth: size, height: 'auto' }}>
      <circle cx={CX} cy={CY} r={136} fill={primaryColor} fillOpacity={0.12} />
      {mode === 'hour' && <circle cx={CX} cy={CY} r={92} fill={primaryColor} fillOpacity={0.22} />}
      <line x1={CX} y1={CY} x2={hand.x} y2={hand.y} stroke={primaryColor} strokeWidth={2} />
      <circle cx={CX} cy={CY} r={5} fill={primaryColor} />
      {mode === 'hour' && hourItems.map((item) => (
        <g key={`h-${item.value}`} pointerEvents="none">
          {item.selected && <circle cx={item.x} cy={item.y} r={20} fill={primaryColor} />}
          <text x={item.x} y={item.y} textAnchor="middle" dominantBaseline="central"
            fontSize={item.ring === 'outer' ? 15 : 12}
            fill={item.selected ? 'white' : textColor}
            fontWeight={item.selected ? 700 : 400}
          >
            {item.value === 0 ? '00' : item.value}
          </text>
        </g>
      ))}
      {mode === 'minute' && minuteItems.map((item) => (
        <g key={`m-${item.value}`} pointerEvents="none">
          {item.selected && <circle cx={item.x} cy={item.y} r={20} fill={primaryColor} />}
          <text x={item.x} y={item.y} textAnchor="middle" dominantBaseline="central"
            fontSize={15}
            fill={item.selected ? 'white' : textColor}
            fontWeight={item.selected ? 700 : 400}
          >
            {item.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

export default ClockFace;
