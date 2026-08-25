import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { DEFAULT_CALENDAR_ITEM_COLOR } from '@/app/platform/core/layout/themes/components/calendar/types.ts';

import React from 'react';

import type { CalendarEvent, FeatureLabel, PersonOption } from './types.ts';

interface Props {
  event: CalendarEvent;
  startLabel: string;
  endLabel: string;
  heightPx: number;
  labels: FeatureLabel[];
  persons: PersonOption[];
  onView: (event: CalendarEvent) => void;
  onEdit?: (event: CalendarEvent) => void;
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// Fills the positioned slot the shared calendar timeline grid gives it
// (see CalendarTimelineColumn's renderItem) with the events-specific look:
// title, time range, label chips and participant initials — content the
// generic DefaultCalendarItemCard doesn't know about.
const DayEventCard: React.FC<Props> = ({ event, startLabel, endLabel, heightPx, labels, persons, onView, onEdit }) => {
  const { theme } = useTheme();
  const color = event.color ?? DEFAULT_CALENDAR_ITEM_COLOR;

  const eventLabels = labels.filter(l => event.label_ids.includes(l.id));
  const eventPersons = persons.filter(p => event.participant_ids.includes(p.id));

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.surface,
        borderLeft: `4px solid ${color}`,
        borderTop: `1px solid ${color}33`,
        borderRight: `1px solid ${color}33`,
        borderBottom: `1px solid ${color}33`,
        borderRadius: '0 4px 4px 0',
        padding: '3px 5px 3px 6px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', flexShrink: 0 }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onView(event); }}
          style={{ background: `${color}22`, border: 'none', borderRadius: '4px', padding: '3px', cursor: 'pointer', lineHeight: 0, flexShrink: 0 }}
        >
          <ThemedSvgIcon name="eye" color={color} size={20} />
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(event); }}
            style={{ background: `${color}22`, border: 'none', borderRadius: '4px', padding: '3px', cursor: 'pointer', lineHeight: 0, flexShrink: 0 }}
          >
            <ThemedSvgIcon name="pencil" color={color} size={20} />
          </button>
        )}
        <span style={{ fontSize: '14px', fontWeight: 800, color: theme.colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
          {event.title}
        </span>
      </div>
      {heightPx > 36 && (
        <span style={{ fontSize: '12px', color: theme.colors.secondary, display: 'block', whiteSpace: 'nowrap', fontWeight: 600 }}>
          {startLabel} → {endLabel}
        </span>
      )}

      {heightPx > 56 && (eventLabels.length > 0 || eventPersons.length > 0) && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginTop: '2px' }}>
          {eventLabels.slice(0, 2).map(l => (
            <span key={l.id} style={{ padding: '2px 7px', borderRadius: '8px', backgroundColor: l.color + 'cc', color: 'white', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {l.name}
            </span>
          ))}
          {eventPersons.slice(0, 4).map(p => (
            <span key={p.id} title={p.name} style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: color + '22', border: `1.5px solid ${color}`, color: color, fontSize: '9px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {initials(p.name)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default DayEventCard;
