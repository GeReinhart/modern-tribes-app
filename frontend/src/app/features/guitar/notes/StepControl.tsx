import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  formatValue?: (v: number) => string;
}

function makeButtonStyle(primaryColor: string): React.CSSProperties {
  return {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: `1px solid ${primaryColor}`,
    backgroundColor: 'transparent',
    color: primaryColor,
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    lineHeight: 1,
  };
}

const StepControl: React.FC<Props> = ({ value, min, max, step = 1, onChange, label, formatValue }) => {
  const { theme } = useTheme();
  const btnStyle = makeButtonStyle(theme.colors.primary);
  const display = formatValue ? formatValue(value) : `${value}`;
  const decrement = () => onChange(Math.max(min, Math.round((value - step) * 10) / 10));
  const increment = () => onChange(Math.min(max, Math.round((value + step) * 10) / 10));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button type="button" style={btnStyle} onClick={decrement}>−</button>
        <span
          style={{
            fontSize: 'var(--font-xl)',
            fontWeight: 600,
            color: theme.colors.text,
            minWidth: '64px',
            textAlign: 'center',
          }}
        >
          {display}
        </span>
        <button type="button" style={btnStyle} onClick={increment}>+</button>
      </div>
    </div>
  );
};

export default StepControl;
