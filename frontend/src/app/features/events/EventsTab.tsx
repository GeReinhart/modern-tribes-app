import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useEvents } from './hooks.ts';
import CalendarMonth from './CalendarMonth.tsx';
import EventCreateModal from './EventCreateModal.tsx';
import EventDayView from './EventDayView.tsx';
import EventModal from './EventModal.tsx';
import EventViewModal from './EventViewModal.tsx';
import type { CalendarEvent, FeatureLabel, PersonOption } from './types.ts';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
}

const EventsTab: React.FC<Props> = ({ featureInstanceId, canEdit, isManager }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const {
    events, labels, persons, error,
    createEvent, updateEvent, deleteEvent,
    setParticipants, setReminders, toggleLabel, createLabel,
  } = useEvents(featureInstanceId);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().slice(0, 10));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const [activeLabelIds, setActiveLabelIds] = useState<string[]>([]);
  const [activePersonIds, setActivePersonIds] = useState<string[]>([]);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const dayEvents = useMemo(
    () => events.filter(e => e.start_at.slice(0, 10) <= selectedDate && e.end_at.slice(0, 10) >= selectedDate).sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [events, selectedDate],
  );

  const dayLabels = useMemo((): FeatureLabel[] => {
    const ids = new Set(dayEvents.flatMap(e => e.label_ids));
    return labels.filter(l => ids.has(l.id));
  }, [dayEvents, labels]);

  const dayPersons = useMemo((): PersonOption[] => {
    const ids = new Set(dayEvents.flatMap(e => e.participant_ids));
    return persons.filter(p => ids.has(p.id));
  }, [dayEvents, persons]);

  const filteredDayEvents = useMemo(() => {
    if (activeLabelIds.length === 0 && activePersonIds.length === 0) return dayEvents;
    return dayEvents.filter(e => {
      const labelOk = activeLabelIds.length === 0 || activeLabelIds.some(id => e.label_ids.includes(id));
      const personOk = activePersonIds.length === 0 || activePersonIds.some(id => e.participant_ids.includes(id));
      return labelOk && personOk;
    });
  }, [dayEvents, activeLabelIds, activePersonIds]);

  const tabActions = useMemo(() => canEdit ? [{
    icon: 'calendar' as const, label: t('features.events.addEvent'),
    onClick: () => setCreating(true),
  }] : [], [canEdit, t]);

  useRegisterTabActions(tabActions);

  return (
    <div>
      {error && (
        <div style={{ padding: '8px 12px', marginBottom: '12px', color: theme.colors.danger, fontSize: 'var(--font-sm)' }}>
          {error}
        </div>
      )}

      <CalendarMonth
        year={year} month={month} events={events} labels={labels}
        selectedDate={selectedDate} onSelectDate={setSelectedDate}
        onPrevMonth={prevMonth} onNextMonth={nextMonth}
      />

      <div style={{ height: '1px', backgroundColor: theme.colors.border, margin: '16px 0' }} />

      <div style={{ marginBottom: '8px', fontWeight: 700, fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
        {new Date(selectedDate + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={() => setCreating(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            marginBottom: '10px', padding: '7px 14px',
            border: `1.5px dashed ${theme.colors.primary}`, borderRadius: '10px',
            background: 'transparent', cursor: 'pointer',
            color: theme.colors.primary, fontSize: 'var(--font-sm)', fontWeight: 600,
          }}
        >
          <ThemedSvgIcon name="plus" color={theme.colors.primary} size={14} />
          <ThemedSvgIcon name="calendar" color={theme.colors.primary} size={16} />
        </button>
      )}

      {(dayLabels.length > 0 || dayPersons.length > 0) && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {dayLabels.map(label => {
            const active = activeLabelIds.includes(label.id);
            return (
              <button key={label.id} type="button"
                onClick={() => setActiveLabelIds(prev => active ? prev.filter(id => id !== label.id) : [...prev, label.id])}
                style={{ padding: '3px 10px', borderRadius: '12px', border: `2px solid ${label.color}`, backgroundColor: active ? label.color : 'transparent', color: active ? 'white' : label.color, fontSize: 'var(--font-xs)', fontWeight: 700, cursor: 'pointer' }}
              >
                {label.name}
              </button>
            );
          })}
          {dayPersons.map(person => {
            const active = activePersonIds.includes(person.id);
            return (
              <button key={person.id} type="button"
                onClick={() => setActivePersonIds(prev => active ? prev.filter(id => id !== person.id) : [...prev, person.id])}
                style={{ padding: '3px 10px', borderRadius: '12px', border: `2px solid ${theme.colors.secondary}`, backgroundColor: active ? theme.colors.secondary : 'transparent', color: active ? theme.colors.surface : theme.colors.secondary, fontSize: 'var(--font-xs)', fontWeight: 700, cursor: 'pointer' }}
              >
                {person.name}
              </button>
            );
          })}
        </div>
      )}

      <EventDayView
        events={filteredDayEvents} labels={labels} persons={persons}
        onSelectEvent={setViewingEvent}
        onEditEvent={canEdit ? setSelectedEvent : undefined}
      />

      {creating && (
        <EventCreateModal
          featureInstanceId={featureInstanceId}
          selectedDate={selectedDate}
          persons={persons}
          labels={labels}
          isManager={isManager}
          onCreate={async (data, participantIds, labelIds, reminders) => {
            const created = await createEvent(data);
            if (created) {
              if (participantIds.length > 0) await setParticipants(created.id, participantIds);
              for (const lid of labelIds) await toggleLabel(created.id, lid);
              if (reminders.length > 0) await setReminders(created.id, reminders);
            }
            setCreating(false);
          }}
          onCreateLabel={createLabel}
          onClose={() => setCreating(false)}
        />
      )}

      {viewingEvent && !selectedEvent && (
        <EventViewModal
          event={viewingEvent}
          labels={labels}
          persons={persons}
          canEdit={canEdit}
          onClose={() => setViewingEvent(null)}
          onEdit={(event) => { setViewingEvent(null); setSelectedEvent(event); }}
        />
      )}

      {selectedEvent && (
        <EventModal
          event={selectedEvent} labels={labels} persons={persons}
          canEdit={canEdit} isManager={isManager} featureInstanceId={featureInstanceId}
          onClose={() => setSelectedEvent(null)}
          onUpdate={async (id, data) => { await updateEvent(id, data); }}
          onDelete={async (id) => { await deleteEvent(id); setSelectedEvent(null); }}
          onSetParticipants={setParticipants}
          onSetReminders={setReminders}
          onToggleLabel={toggleLabel}
          onCreateLabel={createLabel}
        />
      )}
    </div>
  );
};

export default EventsTab;
