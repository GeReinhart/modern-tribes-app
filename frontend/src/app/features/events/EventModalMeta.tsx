import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import PersonSelector from './PersonSelector.tsx';

import EventScheduleFields from './EventScheduleFields.tsx';
import type { PersonOption } from './types.ts';
import { FIBONACCI, fibColor } from './types.ts';

interface Props {
  allDay: boolean;
  multiDay: boolean;
  startAt: string;
  endAt: string;
  persons: PersonOption[];
  participantIds: string[];
  size: number | null;
  canEdit: boolean;
  onAllDayChange: (v: boolean) => void;
  onMultiDayChange: (v: boolean) => void;
  onStartAtChange: (v: string) => void;
  onEndAtChange: (v: string) => void;
  onParticipantsChange: (ids: string[]) => void;
  onSizeChange: (v: number | null) => void;
}

const EventModalMeta: React.FC<Props> = ({
  allDay, multiDay, startAt, endAt, persons, participantIds, size, canEdit,
  onAllDayChange, onMultiDayChange, onStartAtChange, onEndAtChange, onParticipantsChange, onSizeChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    color: theme.colors.secondary, marginBottom: '6px',
  };

  return (
    <>
      <EventScheduleFields
        allDay={allDay}
        multiDay={multiDay}
        startAt={startAt}
        endAt={endAt}
        canEdit={canEdit}
        onAllDayChange={onAllDayChange}
        onMultiDayChange={onMultiDayChange}
        onStartAtChange={onStartAtChange}
        onEndAtChange={onEndAtChange}
      />

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
