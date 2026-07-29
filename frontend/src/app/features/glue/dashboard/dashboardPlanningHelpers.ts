import type { FeatureLabel, PersonOption, PlanningEvent } from '@/app/features/events/types.ts';
import type { MyTasksResponse } from '@/app/features/tasks/my_tasks/types.ts';

export function uniqueLabels(events: PlanningEvent[]): FeatureLabel[] {
  const map = new Map<string, FeatureLabel>();
  events.forEach(e => e.labels.forEach(l => map.set(l.id, l)));
  return Array.from(map.values());
}

export function uniquePersons(events: PlanningEvent[]): PersonOption[] {
  const map = new Map<string, string>();
  events.forEach(e => e.participants.forEach(p => map.set(p.person_id, p.person_name)));
  return Array.from(map, ([id, name]) => ({ id, name }));
}

export function uniqueProjects(events: PlanningEvent[], tasks: MyTasksResponse): { id: string; name: string }[] {
  const seen = new Map<string, string>();
  events.forEach(e => seen.set(e.project_id, e.project_name));
  [...tasks.kanban, ...tasks.todo].forEach(t => seen.set(t.project_id, t.project_name));
  return Array.from(seen, ([id, name]) => ({ id, name }));
}
