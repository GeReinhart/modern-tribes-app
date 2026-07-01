import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';
import CalendarMonth from '@/app/features/events/CalendarMonth.tsx';
import EventDayView from '@/app/features/events/EventDayView.tsx';
import EventModal from '@/app/features/events/EventModal.tsx';
import EventViewModal from '@/app/features/events/EventViewModal.tsx';
import { eventsService } from '@/app/features/events/service.ts';
import type { FeatureLabel, PersonOption, PlanningEvent } from '@/app/features/events/types.ts';
import { useMyTaskMutations, useMyTasks } from '@/app/features/tasks/my_tasks/hooks.ts';
import MyTasksList from '@/app/features/tasks/my_tasks/MyTasksList.tsx';
import type { MyTasksResponse } from '@/app/features/tasks/my_tasks/types.ts';
import DashboardAddEventModal from '@/app/features/glue/dashboard/DashboardAddEventModal.tsx';
import DashboardJournalSection from '@/app/features/glue/dashboard/DashboardJournalSection.tsx';
import { journalService } from '@/app/features/daily-journal/service.ts';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const emptyTasks: MyTasksResponse = { kanban: [], todo: [] };

function uniqueLabels(events: PlanningEvent[]): FeatureLabel[] {
  const map = new Map<string, FeatureLabel>();
  events.forEach(e => e.labels.forEach(l => map.set(l.id, l)));
  return Array.from(map.values());
}

function uniquePersons(events: PlanningEvent[]): PersonOption[] {
  const map = new Map<string, string>();
  events.forEach(e => e.participants.forEach(p => map.set(p.person_id, p.person_name)));
  return Array.from(map, ([id, name]) => ({ id, name }));
}

const DashboardPlanningTab: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<PlanningEvent[]>([]);
  const [viewingEvent, setViewingEvent] = useState<PlanningEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<PlanningEvent | null>(null);
  const [editLabels, setEditLabels] = useState<FeatureLabel[]>([]);
  const [editPersons, setEditPersons] = useState<PersonOption[]>([]);
  const [activeLabelIds, setActiveLabelIds] = useState<string[]>([]);
  const [activeProjectIds, setActiveProjectIds] = useState<string[]>([]);
  const [activePersonIds, setActivePersonIds] = useState<string[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [journalDates, setJournalDates] = useState<Set<string>>(new Set());

  const tabActions = useMemo(
    () => [{ icon: 'plus' as const, label: t('features.events.addEvent'), onClick: () => setShowAddEvent(true) }],
    [t],
  );
  useRegisterTabActions(tabActions);

  const { data, refetch } = useMyTasks({});
  const { markAsDone } = useMyTaskMutations();
  const tasks: MyTasksResponse = data ?? emptyTasks;

  useEffect(() => { eventsService.listAccessible().then(setEvents); }, []);

  useEffect(() => {
    journalService.listAccessibleDates(year, month + 1).then(dates => setJournalDates(new Set(dates)));
  }, [year, month]);

  const prevDay = () => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().slice(0, 10)); };
  const nextDay = () => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().slice(0, 10)); };
  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const startEditing = async (e: PlanningEvent) => { setViewingEvent(null); const [ls, ps] = await Promise.all([eventsService.listLabels(e.feature_instance_id), eventsService.listPersons(e.feature_instance_id)]); setEditLabels(ls); setEditPersons(ps); setEditingEvent(e); };

  const allLabels = useMemo(() => uniqueLabels(events), [events]);
  const allPersons = useMemo(() => uniquePersons(events), [events]);

  const dayEvents = useMemo(
    () => events.filter(e => e.start_at.slice(0, 10) <= selectedDate && e.end_at.slice(0, 10) >= selectedDate).sort((a, b) => a.start_at.localeCompare(b.start_at)),
    [events, selectedDate],
  );
  const dayTasks = useMemo((): MyTasksResponse => ({
    kanban: tasks.kanban.filter(t => t.due_date === selectedDate),
    todo: tasks.todo.filter(t => t.due_date === selectedDate),
  }), [tasks, selectedDate]);

  const dayLabels = useMemo((): FeatureLabel[] => {
    const ids = new Set(dayEvents.flatMap(e => e.label_ids));
    return allLabels.filter(l => ids.has(l.id));
  }, [dayEvents, allLabels]);

  const dayProjects = useMemo(() => {
    const seen = new Map<string, string>();
    dayEvents.forEach(e => seen.set(e.project_id, e.project_name));
    [...dayTasks.kanban, ...dayTasks.todo].forEach(t => seen.set(t.project_id, t.project_name));
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [dayEvents, dayTasks]);

  const dayPersons = useMemo((): PersonOption[] => {
    const ids = new Set(dayEvents.flatMap(e => e.participant_ids));
    return allPersons.filter(p => ids.has(p.id));
  }, [dayEvents, allPersons]);

  const filteredDayEvents = useMemo(() => {
    if (!activeLabelIds.length && !activeProjectIds.length && !activePersonIds.length) return dayEvents;
    return dayEvents.filter(e => {
      const labelOk = !activeLabelIds.length || activeLabelIds.some(id => e.label_ids.includes(id));
      const projectOk = !activeProjectIds.length || activeProjectIds.includes(e.project_id);
      const personOk = !activePersonIds.length || activePersonIds.some(id => e.participant_ids.includes(id));
      return labelOk && projectOk && personOk;
    });
  }, [dayEvents, activeLabelIds, activeProjectIds, activePersonIds]);

  const filteredDayTasks = useMemo((): MyTasksResponse => {
    if (!activeProjectIds.length) return dayTasks;
    return { kanban: dayTasks.kanban.filter(t => activeProjectIds.includes(t.project_id)), todo: dayTasks.todo.filter(t => activeProjectIds.includes(t.project_id)) };
  }, [dayTasks, activeProjectIds]);

  const taskPersons = useMemo(() => {
    const seen = new Map<string, string>();
    [...tasks.kanban, ...tasks.todo].forEach(t => { if (t.assigned_person_id && t.assigned_person_name) seen.set(t.assigned_person_id, t.assigned_person_name); });
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [tasks]);

  const taskDates = useMemo(() => {
    const dates = new Set<string>();
    [...tasks.kanban, ...tasks.todo].forEach(t => { if (t.due_date) dates.add(t.due_date); });
    return dates;
  }, [tasks]);

  const showFilters = dayLabels.length > 0 || dayProjects.length > 1 || dayPersons.length > 0;

  return (
    <div>
      <CalendarMonth
        year={year} month={month} events={events} labels={allLabels}
        selectedDate={selectedDate} onSelectDate={setSelectedDate}
        onPrevMonth={prevMonth} onNextMonth={nextMonth}
        taskDates={taskDates} journalDates={journalDates}
      />
      <div style={{ height: '1px', backgroundColor: theme.colors.border, margin: '16px 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <button type="button" onClick={prevDay} style={{ background: 'none', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', lineHeight: 0 }}>
          <ThemedSvgIcon name="arrow-left" color={theme.colors.text} size={14} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: theme.colors.text, flex: 1, textAlign: 'center' }}>
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <button type="button" onClick={nextDay} style={{ background: 'none', border: `1px solid ${theme.colors.border}`, borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', lineHeight: 0 }}>
          <ThemedSvgIcon name="arrow-right" color={theme.colors.text} size={14} />
        </button>
      </div>
      {showFilters && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {dayLabels.map(label => {
            const active = activeLabelIds.includes(label.id);
            return (
              <button key={label.id} type="button" onClick={() => setActiveLabelIds(prev => active ? prev.filter(id => id !== label.id) : [...prev, label.id])}
                style={{ padding: '3px 10px', borderRadius: '12px', border: `2px solid ${label.color}`, backgroundColor: active ? label.color : 'transparent', color: active ? 'white' : label.color, fontSize: 'var(--font-xs)', fontWeight: 700, cursor: 'pointer' }}>
                {label.name}
              </button>
            );
          })}
          {dayProjects.map(proj => {
            const active = activeProjectIds.includes(proj.id);
            return (
              <button key={proj.id} type="button" onClick={() => setActiveProjectIds(prev => active ? prev.filter(id => id !== proj.id) : [...prev, proj.id])}
                style={{ padding: '3px 10px', borderRadius: '12px', border: `2px solid ${theme.colors.primary}`, backgroundColor: active ? theme.colors.primary : 'transparent', color: active ? 'white' : theme.colors.primary, fontSize: 'var(--font-xs)', fontWeight: 700, cursor: 'pointer' }}>
                {proj.name}
              </button>
            );
          })}
          {dayPersons.map(person => {
            const active = activePersonIds.includes(person.id);
            return (
              <button key={person.id} type="button" onClick={() => setActivePersonIds(prev => active ? prev.filter(id => id !== person.id) : [...prev, person.id])}
                style={{ padding: '3px 10px', borderRadius: '12px', border: `2px solid ${theme.colors.secondary}`, backgroundColor: active ? theme.colors.secondary : 'transparent', color: active ? theme.colors.surface : theme.colors.secondary, fontSize: 'var(--font-xs)', fontWeight: 700, cursor: 'pointer' }}>
                {person.name}
              </button>
            );
          })}
        </div>
      )}
      <EventDayView
        events={filteredDayEvents} labels={allLabels} persons={allPersons}
        onSelectEvent={e => setViewingEvent(e as PlanningEvent)}
        onEditEvent={e => startEditing(e as PlanningEvent)}
      />
      <div style={{ marginTop: '16px', borderTop: `1px solid ${theme.colors.border}`, paddingTop: '12px' }}>
        <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, textTransform: 'uppercase', color: theme.colors.secondary, marginBottom: '8px' }}>
          {t('dashboard.planning.tasksDue')}
        </div>
        <MyTasksList data={filteredDayTasks} persons={taskPersons} onMarkDone={async task => { await markAsDone(task); await refetch(); }} />
      </div>
      <DashboardJournalSection selectedDate={selectedDate} />
      {viewingEvent && !editingEvent && (
        <EventViewModal event={viewingEvent} labels={allLabels} persons={allPersons} canEdit={true}
          projectName={viewingEvent.project_name} onClose={() => setViewingEvent(null)}
          onEdit={e => startEditing(e as PlanningEvent)}
        />
      )}
      {editingEvent && (
        <EventModal event={editingEvent} labels={editLabels} persons={editPersons}
          canEdit={true} isManager={false} featureInstanceId={editingEvent.feature_instance_id}
          onClose={() => { setEditingEvent(null); eventsService.listAccessible().then(setEvents); }}
          onUpdate={async (id, data) => { await eventsService.update(id, data); }}
          onDelete={async (id) => { await eventsService.delete(id); }}
          onSetParticipants={async (id, ids) => { await eventsService.setParticipants(id, ids); }}
          onSetReminders={async (id, rs) => { await eventsService.setReminders(id, rs); }}
          onToggleLabel={(id, lid) => eventsService.toggleLabel(id, lid)}
          onCreateLabel={data => eventsService.createLabel(data)}
        />
      )}
      {showAddEvent && (
        <DashboardAddEventModal
          selectedDate={selectedDate}
          onClose={() => setShowAddEvent(false)}
          onCreated={() => eventsService.listAccessible().then(setEvents)}
        />
      )}
    </div>
  );
};

export default DashboardPlanningTab;
