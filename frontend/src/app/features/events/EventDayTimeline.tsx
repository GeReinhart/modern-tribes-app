import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface Props {
  startAt: string;
  endAt: string;
  color?: string;
  title?: string;
  refStartAt?: string;
  refEndAt?: string;
  refColor?: string;
  refTitle?: string;
}

const TOTAL_H = 240;
const LABEL_HOURS = [0, 6, 12, 18];

function timeToFrac(v: string): number {
  const t = (v.split('T')[1] ?? '00:00').slice(0, 5);
  const [h, m] = t.split(':').map(Number);
  return ((h || 0) + (m || 0) / 60) / 24;
}

const EventDayTimeline: React.FC<Props> = ({ startAt, endAt, color, title, refStartAt, refEndAt, refColor, refTitle }) => {
  const { theme } = useTheme();
  const eventColor = color ?? theme.colors.primary;

  const startFrac = timeToFrac(startAt);
  const endFrac = timeToFrac(endAt);
  const top = startFrac * TOTAL_H;
  const height = Math.max((endFrac - startFrac) * TOTAL_H, 10);

  const refTop = refStartAt ? timeToFrac(refStartAt) * TOTAL_H : null;
  const refHeight = refStartAt && refEndAt ? Math.max((timeToFrac(refEndAt) - timeToFrac(refStartAt)) * TOTAL_H, 10) : null;
  const refBlockColor = refColor ?? theme.colors.primary;

  const now = new Date();
  const nowTop = ((now.getHours() + now.getMinutes() / 60) / 24) * TOTAL_H;

  return (
    <div style={{ display: 'flex', gap: '4px', flexShrink: 0, paddingTop: '24px' }}>
      <div style={{ position: 'relative', width: '30px', height: TOTAL_H }}>
        {LABEL_HOURS.map((h) => (
          <span key={h} style={{ position: 'absolute', top: (h / 24) * TOTAL_H - 7, right: 0, fontSize: '9px', color: theme.colors.secondary, lineHeight: 1, whiteSpace: 'nowrap' }}>
            {String(h).padStart(2, '0')}h
          </span>
        ))}
      </div>

      <div style={{ position: 'relative', width: '48px', height: TOTAL_H, backgroundColor: theme.colors.border + '44', borderRadius: '6px' }}>
        {LABEL_HOURS.map((h) => (
          <div key={h} style={{ position: 'absolute', top: (h / 24) * TOTAL_H, left: 0, right: 0, height: '1px', backgroundColor: theme.colors.border }} />
        ))}

        {refTop !== null && refHeight !== null && (
          <div style={{ position: 'absolute', top: refTop, left: '3px', right: '3px', height: refHeight, backgroundColor: refBlockColor, borderRadius: '4px', opacity: 0.35, overflow: 'hidden', display: 'flex', alignItems: 'flex-start' }}>
            {refHeight > 14 && refTitle && (
              <span style={{ fontSize: '7px', color: 'white', fontWeight: 700, padding: '2px 3px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '100%' }}>
                {refTitle}
              </span>
            )}
          </div>
        )}

        <div style={{ position: 'absolute', top, left: '3px', right: '3px', height, backgroundColor: eventColor, borderRadius: '4px', opacity: 0.85, overflow: 'hidden', display: 'flex', alignItems: 'flex-start' }}>
          {height > 14 && title && (
            <span style={{ fontSize: '7px', color: 'white', fontWeight: 700, padding: '2px 3px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '100%' }}>
              {title}
            </span>
          )}
        </div>

        <div style={{ position: 'absolute', top: nowTop, left: 0, right: 0, height: '2px', backgroundColor: theme.colors.danger, borderRadius: '1px' }} />
      </div>
    </div>
  );
};

export default EventDayTimeline;
