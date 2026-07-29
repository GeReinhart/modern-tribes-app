import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';
import CalendarFilterBar from '@/app/features/events/CalendarFilterBar.tsx';
import type { FilterChipGroup } from '@/app/features/events/CalendarFilterBar.tsx';
import EventDayView from '@/app/features/events/EventDayView.tsx';
import EventModal from '@/app/features/events/EventModal.tsx';
import EventViewModal from '@/app/features/events/EventViewModal.tsx';
import EventWeekView from '@/app/features/events/EventWeekView.tsx';
import { eventsService } from '@/app/features/events/service.ts';
import type { FeatureLabel, PersonOption, PlanningEvent } from '@/app/features/events/types.ts';
import { useCalendarViewToggle } from '@/app/features/events/useCalendarViewToggle.ts';
import { useVisibleCalendarEvents } from '@/app/features/events/useVisibleCalendarEvents.ts';
import { useMyTaskMutations, useMyTasks } from '@/app/features/tasks/my_tasks/hooks.ts';
import MyTasksList from '@/app/features/tasks/my_tasks/MyTasksList.tsx';
import type { MyTasksResponse } from '@/app/features/tasks/my_tasks/types.ts';
import DashboardAddEventModal from '@/app/features/glue/dashboard/DashboardAddEventModal.tsx';
import DashboardDayHeader from '@/app/features/glue/dashboard/DashboardDayHeader.tsx';
import DashboardJournalSection from '@/app/features/glue/dashboard/DashboardJournalSection.tsx';
import { uniqueLabels, uniquePersons, uniqueProjects } from '@/app/features/glue/dashboard/dashboardPlanningHelpers.ts';
import { journalService } from '@/app/features/daily-journal/service.ts';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const emptyTasks: MyTasksResponse = { kanban: [], todo: [] };

const DashboardPlanningTab: React.FC = () => {
  const { t } = useTranslation();
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

  const { viewMode, toggleAction } = useCalendarViewToggle('dashboard-planning-view-mode', t);
  const { data, refetch } = useMyTasks({});
  const { markAsDone } = useMyTaskMutations();
  const tasks: MyTasksResponse = data ?? emptyTasks;

  const tabActions = useMemo(
    () => [{ icon: 'plus' as const, badgeIcon: 'calendar' as const, label: t('features.events.addEvent'), onClick: () => setShowAddEvent(true) }, toggleAction],
    [t, toggleAction],
  );
  useRegisterTabActions(tabActions);

  useEffect(() => { eventsService.listAccessible().then(setEvents); }, []);

  useEffect(() => {
    journalService.listAccessibleDates(year, month + 1).then(dates => setJournalDates(new Set(dates)));
  }, [year, month]);

  const selectDate = (date: string) => {
    setSelectedDate(date);
    const [y, m] = date.split('-').map(Number);
    setYear(y); setMonth(m - 1);
  };
  const shiftSelectedDate = (days: number) => {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + days);
    selectDate(d.toISOString().slice(0, 10));
  };
  const prevDay = () => shiftSelectedDate(-1);
  const nextDay = () => shiftSelectedDate(1);
  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const startEditing = async (e: PlanningEvent) => { setViewingEvent(null); const [ls, ps] = await Promise.all([eventsService.listLabels(e.feature_instance_id), eventsService.listPersons(e.feature_instance_id)]); setEditLabels(ls); setEditPersons(ps); setEditingEvent(e); };
  const allLabels = useMemo(() => uniqueLabels(events), [events]);
  const allPersons = useMemo(() => uniquePersons(events), [events]);
  const { visibleEvents, visibleLabels, visiblePersons } = useVisibleCalendarEvents(events, allLabels, allPersons, selectedDate, viewMode);

  const dayTasks = useMemo((): MyTasksResponse => ({
    kanban: tasks.kanban.filter(t => t.due_date === selectedDate),
    todo: tasks.todo.filter(t => t.due_date === selectedDate),
  }), [tasks, selectedDate]);

  const projectOptions = useMemo(() => uniqueProjects(visibleEvents, dayTasks), [visibleEvents, dayTasks]);

  const filteredEvents = useMemo(() => {
    if (!activeLabelIds.length && !activeProjectIds.length && !activePersonIds.length) return visibleEvents;
    return visibleEvents.filter(e => {
      const labelOk = !activeLabelIds.length || activeLabelIds.some(id => e.label_ids.includes(id));
      const projectOk = !activeProjectIds.length || activeProjectIds.includes(e.project_id);
      const personOk = !activePersonIds.length || activePersonIds.some(id => e.participant_ids.includes(id));
      return labelOk && projectOk && personOk;
    });
  }, [visibleEvents, activeLabelIds, activeProjectIds, activePersonIds]);

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

  const filterGroups: FilterChipGroup[] = useMemo(() => [
    ...visibleLabels.map(label => ({
      id: label.id, label: label.name, color: label.color,
      active: activeLabelIds.includes(label.id),
      onToggle: () => setActiveLabelIds(prev => prev.includes(label.id) ? prev.filter(id => id !== label.id) : [...prev, label.id]),
    })),
    ...(projectOptions.length > 1 ? projectOptions.map(proj => ({
      id: proj.id, label: proj.name, color: theme.colors.primary,
      active: activeProjectIds.includes(proj.id),
      onToggle: () => setActiveProjectIds(prev => prev.includes(proj.id) ? prev.filter(id => id !== proj.id) : [...prev, proj.id]),
    })) : []),
    ...visiblePersons.map(person => ({
      id: person.id, label: person.name, color: theme.colors.secondary, activeTextColor: theme.colors.surface,
      active: activePersonIds.includes(person.id),
      onToggle: () => setActivePersonIds(prev => prev.includes(person.id) ? prev.filter(id => id !== person.id) : [...prev, person.id]),
    })),
  ], [visibleLabels, visiblePersons, projectOptions, activeLabelIds, activeProjectIds, activePersonIds, theme]);

  return (
    <div>
      {viewMode === 'day' && (
        <DashboardDayHeader
          year={year} month={month} events={events}
          selectedDate={selectedDate} taskDates={taskDates} journalDates={journalDates}
          onSelectDate={selectDate} onPrevMonth={prevMonth} onNextMonth={nextMonth}
          onPrevDay={prevDay} onNextDay={nextDay}
        />
      )}

      <CalendarFilterBar groups={filterGroups} />

      {viewMode === 'day' ? (
        <EventDayView
          events={filteredEvents} labels={allLabels} persons={allPersons}
          selectedDate={selectedDate}
          onSelectEvent={e => setViewingEvent(e as PlanningEvent)}
          onEditEvent={e => startEditing(e as PlanningEvent)}
        />
      ) : (
        <EventWeekView
          events={filteredEvents} labels={allLabels} persons={allPersons}
          selectedDate={selectedDate} onSelectDate={selectDate}
          onPrevWeek={() => shiftSelectedDate(-7)} onNextWeek={() => shiftSelectedDate(7)}
          onSelectEvent={e => setViewingEvent(e as PlanningEvent)}
          onEditEvent={e => startEditing(e as PlanningEvent)}
        />
      )}

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
