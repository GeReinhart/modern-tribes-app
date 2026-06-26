import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import ThemedDateSelection from '@/app/platform/core/layout/themes/components/ThemedDateSelection.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import PersonSelector from './PersonSelector.tsx';

import EventTimePicker from './EventTimePicker.tsx';
import type { PersonOption } from './types.ts';
import { FIBONACCI, fibColor } from './types.ts';

interface Props {
  allDay: boolean;
  startAt: string;
  endAt: string;
  persons: PersonOption[];
  participantIds: string[];
  size: number | null;
  canEdit: boolean;
  onAllDayChange: (v: boolean) => void;
  onStartAtChange: (v: string) => void;
  onEndAtChange: (v: string) => void;
  onParticipantsChange: (ids: string[]) => void;
  onSizeChange: (v: number | null) => void;
}

function parseDt(v: string): Date {
  const [d, t = '00:00'] = v.split('T');
  const [y, mo, day] = d.split('-').map(Number);
  const [h, mi] = (t || '00:00').split(':').map(Number);
  return new Date(y, mo - 1, day, h || 0, mi || 0);
}

function fmtDuration(startAt: string, endAt: string): string {
  const mins = Math.round((parseDt(endAt).getTime() - parseDt(startAt).getTime()) / 60000);
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h === 0 ? `${m}min` : m === 0 ? `${h}h` : `${h}h ${m}min`;
}

const EventModalMeta: React.FC<Props> = ({
  allDay, startAt, endAt, persons, participantIds, size, canEdit,
  onAllDayChange, onStartAtChange, onEndAtChange, onParticipantsChange, onSizeChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    color: theme.colors.secondary, marginBottom: '6px',
  };

  const duration = fmtDuration(startAt, endAt);

  return (
    <>
      <div>
        <div style={sectionLabel}>{t('features.events.schedule')}</div>

        {allDay ? (
          <>
            <label style={{ display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', fontSize: 'var(--font-sm)', color: theme.colors.text, marginBottom: '10px' }}>
              <input type="checkbox" checked={allDay} onChange={(e) => canEdit && onAllDayChange(e.target.checked)} disabled={!canEdit} />
              {t('features.events.allDay')}
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <ThemedDateSelection
                value={startAt.slice(0, 10)}
                onChange={(d) => {
                  if (!canEdit) return;
                  onStartAtChange(d + 'T00:00');
                  if (endAt.slice(0, 10) < d) onEndAtChange(d + 'T23:59');
                }}
                disabled={!canEdit}
                label={t('features.events.from')}
                dateFormat="EEEE dd/MM/yyyy"
              />
              <ThemedDateSelection
                value={endAt.slice(0, 10)}
                onChange={(d) => canEdit && onEndAtChange(d + 'T23:59')}
                disabled={!canEdit}
                label={t('features.events.to')}
                dateFormat="EEEE dd/MM/yyyy"
                minDate={startAt.slice(0, 10)}
              />
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '10px' }}>
              <ThemedDateSelection
                value={startAt.slice(0, 10)}
                onChange={(d) => {
                  if (!canEdit) return;
                  onStartAtChange(d + 'T' + startAt.slice(11, 16));
                  onEndAtChange(d + 'T' + endAt.slice(11, 16));
                }}
                disabled={!canEdit}
                dateFormat="EEEE dd/MM/yyyy"
                width="190px"
              />
            </div>
            <label style={{ display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer', fontSize: 'var(--font-sm)', color: theme.colors.text, marginBottom: '10px' }}>
              <input type="checkbox" checked={allDay} onChange={(e) => canEdit && onAllDayChange(e.target.checked)} disabled={!canEdit} />
              {t('features.events.allDay')}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>{t('features.events.from')}</span>
              <EventTimePicker
                startAt={startAt} endAt={endAt}
                onStartAtChange={(v) => canEdit && onStartAtChange(v)}
                onEndAtChange={(v) => canEdit && onEndAtChange(v)}
                disabled={!canEdit}
              />
              <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>{t('features.events.to').toLowerCase()}</span>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: theme.colors.text }}>{endAt.slice(11, 16) || '--:--'}</span>
              {duration && (
                <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
                  ({t('features.events.during')} {duration})
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <PersonSelector
        persons={persons}
        selectedIds={participantIds}
        onChange={onParticipantsChange}
        disabled={!canEdit}
      />

      <div>
        <div style={sectionLabel}>{t('features.events.storyPoints')}</div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {FIBONACCI.map((n) => (
            <button key={n} type="button" onClick={() => canEdit && onSizeChange(size === n ? null : n)} disabled={!canEdit} style={{ width: '34px', height: '34px', borderRadius: '8px', fontSize: 'var(--font-sm)', fontWeight: 700, cursor: canEdit ? 'pointer' : 'default', border: `1.5px solid ${size === n ? fibColor(n) || theme.colors.primary : theme.colors.border}`, backgroundColor: size === n ? fibColor(n) || theme.colors.primary : 'transparent', color: size === n ? theme.colors.surface : theme.colors.text }}>
              {n}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default EventModalMeta;
