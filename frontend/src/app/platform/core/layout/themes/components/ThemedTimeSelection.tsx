import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import ClockFace from './ClockFace.tsx';

import React, { useState } from 'react';

interface Props {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
}

function parseTime(v: string): { hour: number; minute: number } {
  const [h = '0', m = '0'] = v.split(':');
  return { hour: parseInt(h, 10) || 0, minute: parseInt(m, 10) || 0 };
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

const ThemedTimeSelection: React.FC<Props> = ({ value, onChange, disabled = false, label }) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'hour' | 'minute'>('hour');
  const [tempHour, setTempHour] = useState(0);
  const [tempMinute, setTempMinute] = useState(0);
  const [hourSet, setHourSet] = useState(false);
  const [minuteSet, setMinuteSet] = useState(false);

  const openPicker = () => {
    if (disabled) return;
    const { hour, minute } = parseTime(value);
    setTempHour(hour);
    setTempMinute(minute);
    const hasValue = value.includes(':');
    setHourSet(hasValue);
    setMinuteSet(hasValue);
    setActiveSection('hour');
    setOpen(true);
  };

  const handleHourSelect = (h: number) => {
    setTempHour(h);
    setHourSet(true);
    setActiveSection('minute');
  };

  const handleMinuteSelect = (m: number) => {
    setTempMinute(m);
    setMinuteSet(true);
  };

  const handleOk = () => { onChange(formatTime(tempHour, tempMinute)); setOpen(false); };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, color: theme.colors.secondary,
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'block',
  };

  const triggerStyle: React.CSSProperties = {
    padding: '8px 16px', border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px', backgroundColor: theme.colors.surface,
    color: theme.colors.text, fontSize: 'var(--font-sm)', fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
    letterSpacing: '0.05em', minWidth: '72px',
  };

  const sectionStyle = (active: boolean): React.CSSProperties => ({
    fontSize: '52px', fontWeight: 300, cursor: 'pointer',
    color: active ? 'white' : 'rgba(255,255,255,0.55)',
    padding: '4px 10px', borderRadius: '8px',
    backgroundColor: active ? 'rgba(0,0,0,0.15)' : 'transparent',
    lineHeight: 1,
  });

  const actionBtnStyle: React.CSSProperties = {
    padding: '8px 20px', border: 'none', background: 'none',
    color: theme.colors.primary, fontWeight: 700, cursor: 'pointer',
    borderRadius: '8px', fontSize: 'var(--font-sm)', letterSpacing: '0.06em',
  };

  return (
    <div>
      {label && <span style={labelStyle}>{label}</span>}
      <button type="button" onClick={openPicker} style={triggerStyle}>
        {value || '--:--'}
      </button>

      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div style={{ backgroundColor: theme.colors.surface, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ backgroundColor: theme.colors.primary, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
              <span onClick={() => setActiveSection('hour')} style={sectionStyle(activeSection === 'hour')}>
                {String(tempHour).padStart(2, '0')}
              </span>
              <span style={{ fontSize: '52px', fontWeight: 300, color: 'rgba(255,255,255,0.8)', lineHeight: 1 }}>:</span>
              <span onClick={() => setActiveSection('minute')} style={sectionStyle(activeSection === 'minute')}>
                {String(tempMinute).padStart(2, '0')}
              </span>
            </div>

            <div style={{ padding: '16px 24px 8px', display: 'flex', justifyContent: 'center' }}>
              <ClockFace
                mode={activeSection} hour={tempHour} minute={tempMinute}
                onSelect={activeSection === 'hour' ? handleHourSelect : handleMinuteSelect}
                primaryColor={theme.colors.primary}
                textColor={theme.colors.text}
                secondaryColor={theme.colors.secondary}
              />
            </div>

            <div style={{ padding: '4px 16px 16px', display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
              <button type="button" onClick={() => setOpen(false)} style={actionBtnStyle}>CANCEL</button>
              {hourSet && minuteSet && (
                <button type="button" onClick={handleOk} style={{ ...actionBtnStyle, backgroundColor: theme.colors.primary, color: theme.colors.surface, borderRadius: '8px' }}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemedTimeSelection;
