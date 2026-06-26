import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  startAt: string;
  endAt: string;
  onEndAtChange: (v: string) => void;
  canEdit: boolean;
}

const DECREASE = [{ delta: -60, label: '-1H' }, { delta: -30, label: '-30mn' }, { delta: -15, label: '-15mn' }];
const INCREASE = [{ delta: 15, label: '+15mn' }, { delta: 30, label: '+30mn' }, { delta: 60, label: '+1H' }];
const MIN_DURATION = 30;

function parseDatetime(v: string): Date {
  const [d, t = '00:00'] = v.split('T');
  const [y, mo, day] = d.split('-').map(Number);
  const [h, mi] = (t || '00:00').split(':').map(Number);
  return new Date(y, mo - 1, day, h || 0, mi || 0);
}

function formatDatetime(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}mn`;
  if (m === 0) return `${h}H`;
  return `${h}H${m}`;
}

const EventDurationSelector: React.FC<Props> = ({ startAt, endAt, onEndAtChange, canEdit }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const start = parseDatetime(startAt);
  const end = parseDatetime(endAt);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

  const adjustDelta = (delta: number) => {
    if (!canEdit) return;
    const newEnd = new Date(end.getTime() + delta * 60000);
    if (newEnd <= start) return;
    onEndAtChange(formatDatetime(newEnd));
  };

  return (
    <div>
      <span style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.secondary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'block' }}>
        {t('features.events.duration')}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>

        {DECREASE.map(item => {
          const disabled = !canEdit || durationMinutes + item.delta < MIN_DURATION;
          return (
            <button key={item.delta} type="button" disabled={disabled}
              onClick={() => adjustDelta(item.delta)}
              style={{ flex: 1, padding: '5px 2px', fontSize: '11px', fontWeight: 700,
                border: `1.5px solid ${theme.colors.danger}44`, borderRadius: '8px',
                backgroundColor: theme.colors.danger + '18',
                color: disabled ? theme.colors.danger + '55' : theme.colors.danger,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.4 : 1 }}>
              {item.label}
            </button>
          );
        })}

        <div style={{ flex: '0 0 auto', padding: '5px 10px', borderRadius: '8px',
          backgroundColor: theme.colors.primary, textAlign: 'center', minWidth: 48 }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: theme.colors.surface, whiteSpace: 'nowrap' }}>
            {fmtDuration(durationMinutes)}
          </span>
        </div>

        {INCREASE.map(item => (
          <button key={item.delta} type="button" disabled={!canEdit}
            onClick={() => adjustDelta(item.delta)}
            style={{ flex: 1, padding: '5px 2px', fontSize: '11px', fontWeight: 700,
              border: `1.5px solid ${theme.colors.success}44`, borderRadius: '8px',
              backgroundColor: theme.colors.success + '18', color: theme.colors.success,
              cursor: canEdit ? 'pointer' : 'not-allowed' }}>
            {item.label}
          </button>
        ))}

      </div>
    </div>
  );
};

export default EventDurationSelector;
