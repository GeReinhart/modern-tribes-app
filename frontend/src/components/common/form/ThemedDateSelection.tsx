import { useTheme } from '@/contexts/ThemeContext';

import React, { forwardRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { fr } from 'date-fns/locale';

import './datepicker-theme.css';

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface StyledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  borderColor: string;
  bgColor: string;
  textColor: string;
}

const StyledInput = forwardRef<HTMLInputElement, StyledInputProps>(
  ({ borderColor, bgColor, textColor, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      style={{
        padding: '8px 12px',
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        backgroundColor: bgColor,
        color: textColor,
        fontSize: 'var(--font-sm)',
        boxSizing: 'border-box',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1,
        width: '100%',
      }}
    />
  ),
);

const ThemedDateSelection: React.FC<Props> = ({
  value,
  onChange,
  disabled = false,
  label,
}) => {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--dp-surface', theme.colors.surface);
    root.style.setProperty('--dp-border', theme.colors.border);
    root.style.setProperty('--dp-text', theme.colors.text);
    root.style.setProperty('--dp-primary', theme.colors.primary);
    root.style.setProperty('--dp-secondary', theme.colors.secondary);
    root.style.setProperty('--dp-today', theme.colors.accent);
  }, [theme]);

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: theme.colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '8px',
    display: 'block',
  };

  return (
    <div style={{ flex: '1 1 160px' }}>
      {label && <span style={labelStyle}>{label}</span>}
      <DatePicker
        selected={parseDate(value)}
        onChange={(date: Date | null) => onChange(date ? toISODate(date) : '')}
        locale={fr}
        dateFormat="dd/MM/yyyy"
        disabled={disabled}
        placeholderText="jj/mm/aaaa"
        customInput={
          <StyledInput
            borderColor={theme.colors.border}
            bgColor={theme.colors.surface}
            textColor={theme.colors.text}
          />
        }
      />
    </div>
  );
};

export default ThemedDateSelection;
