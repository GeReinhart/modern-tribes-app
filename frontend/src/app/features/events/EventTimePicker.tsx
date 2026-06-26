import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import ClockFace from '@/app/platform/core/layout/themes/components/ClockFace.tsx';

import React, { useEffect, useState } from 'react';

import EventDayTimeline from './EventDayTimeline.tsx';
import EventDurationSelector from './EventDurationSelector.tsx';

interface Props {
  startAt: string;
  endAt: string;
  onStartAtChange: (v: string) => void;
  onEndAtChange: (v: string) => void;
  disabled?: boolean;
  label?: string;
  showDuration?: boolean;
  maxAt?: string;
  eventStartAt?: string;
  eventEndAt?: string;
  eventTitle?: string;
}

function parseDt(v: string): Date {
  const [d, t = '00:00'] = v.split('T');
  const [y, mo, day] = d.split('-').map(Number);
  const [h, mi] = (t || '00:00').split(':').map(Number);
  return new Date(y, mo - 1, day, h || 0, mi || 0);
}

function fmtDt(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

function fmtDuration(start: string, end: string): string {
  const mins = Math.round((parseDt(end).getTime() - parseDt(start).getTime()) / 60000);
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h === 0 ? `${m}min` : m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function useIsNarrow(): boolean {
  const [narrow, setNarrow] = useState(() => window.innerWidth < 700);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 699px)');
    const handler = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return narrow;
}

const EventTimePicker: React.FC<Props> = ({ startAt, endAt, onStartAtChange, onEndAtChange, disabled = false, label, showDuration = true, maxAt, eventStartAt, eventEndAt, eventTitle }) => {
  const { theme } = useTheme();
  const isNarrow = useIsNarrow();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<'hour' | 'minute'>('hour');
  const [tempStart, setTempStart] = useState(startAt);
  const [tempEnd, setTempEnd] = useState(endAt);
  const [hourSet, setHourSet] = useState(false);
  const [minuteSet, setMinuteSet] = useState(false);

  const startDate = startAt.slice(0, 10);
  const tempH = parseInt(tempStart.slice(11, 13), 10) || 0;
  const tempM = parseInt(tempStart.slice(14, 16), 10) || 0;

  const openPicker = () => {
    if (disabled) return;
    setTempStart(startAt);
    setTempEnd(endAt);
    const has = startAt.includes('T');
    setHourSet(has);
    setMinuteSet(has);
    setSection('hour');
    setOpen(true);
  };

  const shiftEnd = (newStart: string) => {
    const delta = parseDt(newStart).getTime() - parseDt(tempStart).getTime();
    const newEnd = new Date(parseDt(tempEnd).getTime() + delta);
    setTempStart(newStart);
    setTempEnd(fmtDt(newEnd));
  };

  const p2 = (n: number) => String(n).padStart(2, '0');

  const handleHour = (h: number) => {
    setHourSet(true);
    setSection('minute');
    shiftEnd(`${startDate}T${p2(h)}:${p2(tempM)}`);
  };

  const handleMinute = (m: number) => {
    setMinuteSet(true);
    shiftEnd(`${startDate}T${p2(tempH)}:${p2(m)}`);
  };

  const isAfterMax = maxAt ? tempStart >= maxAt : false;

  const handleOk = () => { onStartAtChange(tempStart); onEndAtChange(tempEnd); setOpen(false); };

  const segStyle = (active: boolean): React.CSSProperties => ({
    fontSize: isNarrow ? '36px' : '52px', fontWeight: 300, cursor: 'pointer', lineHeight: 1,
    color: active ? 'white' : 'rgba(255,255,255,0.5)',
    padding: isNarrow ? '2px 6px' : '4px 10px', borderRadius: '8px',
    backgroundColor: active ? 'rgba(0,0,0,0.15)' : 'transparent',
  });

  const triggerStyle: React.CSSProperties = {
    padding: '8px 16px', border: `1px solid ${theme.colors.border}`, borderRadius: '8px',
    backgroundColor: theme.colors.surface, color: theme.colors.text, fontSize: 'var(--font-sm)',
    fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
    letterSpacing: '0.05em',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, color: theme.colors.secondary,
    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'block',
  };

  return (
    <div>
      {label && <span style={labelStyle}>{label}</span>}
      <button type="button" onClick={openPicker} style={triggerStyle}>{startAt.slice(11, 16) || '--:--'}</button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div style={{ backgroundColor: theme.colors.surface, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', maxWidth: '680px', width: '100%' }}>
            {/* Header */}
            <div style={{ backgroundColor: theme.colors.primary, padding: isNarrow ? '12px 16px' : '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <span onClick={() => setSection('hour')} style={segStyle(section === 'hour')}>{p2(tempH)}</span>
              <span style={{ fontSize: '52px', fontWeight: 300, color: 'rgba(255,255,255,0.8)', lineHeight: 1 }}>:</span>
              <span onClick={() => setSection('minute')} style={segStyle(section === 'minute')}>{p2(tempM)}</span>
              {showDuration && fmtDuration(tempStart, tempEnd) && (
                <span style={{ fontSize: isNarrow ? '18px' : '22px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginLeft: '16px', alignSelf: 'flex-end', paddingBottom: '10px' }}>{fmtDuration(tempStart, tempEnd)}</span>
              )}
            </div>

            {/* Body */}
            <div style={{ display: 'flex', gap: '0' }}>
              {/* Clock + duration */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                <div style={{ padding: '12px 24px 4px', display: 'flex', justifyContent: 'center' }}>
                  <ClockFace mode={section} hour={tempH} minute={tempM} onSelect={section === 'hour' ? handleHour : handleMinute} primaryColor={theme.colors.primary} textColor={theme.colors.text} secondaryColor={theme.colors.secondary} />
                </div>
                {showDuration && (
                  <div style={{ padding: '4px 16px 8px' }}>
                    <EventDurationSelector startAt={tempStart} endAt={tempEnd} onEndAtChange={setTempEnd} canEdit={true} />
                  </div>
                )}
              </div>

              {/* Day timeline: hidden on narrow screens */}
              {!isNarrow && (
                <>
                  <div style={{ width: '1px', backgroundColor: theme.colors.border, margin: '16px 0' }} />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 24px' }}>
                    <EventDayTimeline
                      startAt={tempStart}
                      endAt={tempEnd}
                      refStartAt={eventStartAt}
                      refEndAt={eventEndAt}
                      refTitle={eventTitle}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '4px 16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', borderTop: `1px solid ${theme.colors.border}` }}>
              {isAfterMax && hourSet && minuteSet ? (
                <span style={{ fontSize: 'var(--font-xs)', color: theme.colors.danger, fontWeight: 600 }}>
                  Doit être avant {maxAt!.slice(11, 16)}
                </span>
              ) : <span />}
              <div style={{ display: 'flex', gap: '4px' }}>
                <button type="button" onClick={() => setOpen(false)} style={{ padding: '8px 20px', border: 'none', background: 'none', color: theme.colors.primary, fontWeight: 700, cursor: 'pointer', borderRadius: '8px', fontSize: 'var(--font-sm)' }}>CANCEL</button>
                {hourSet && minuteSet && !isAfterMax && (
                  <button type="button" onClick={handleOk} style={{ padding: '8px 20px', border: 'none', backgroundColor: theme.colors.primary, color: theme.colors.surface, fontWeight: 700, cursor: 'pointer', borderRadius: '8px', fontSize: 'var(--font-sm)' }}>OK</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventTimePicker;
