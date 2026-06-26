export type { PersonOption, FeatureLabel, FeatureLabelCreate, FeatureLabelUpdate } from '@/app/features/tasks/types.ts';
export { FIBONACCI, fibColor } from '@/app/features/tasks/types.ts';

export interface EventParticipantInfo {
  person_id: string;
  person_name: string;
}

export interface EventReminderCreate {
  remind_at: string;
  reminder_type: 'notification' | 'mail';
}

export interface EventReminder {
  id: string;
  event_id: string;
  remind_at: string;
  reminder_type: 'notification' | 'mail';
  sent: boolean;
}

export interface CalendarEvent {
  id: string;
  feature_instance_id: string;
  title: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  document_id: string | null;
  document_content_html: string | null;
  size: number | null;
  force_on_dashboard: boolean;
  status: string;
  participant_ids: string[];
  participants: EventParticipantInfo[];
  label_ids: string[];
  reminders: EventReminder[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface PlanningEventLabel {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface PlanningEvent extends CalendarEvent {
  feature_instance_name: string;
  project_id: string;
  project_url_param_id: string | null;
  project_name: string;
  labels: PlanningEventLabel[];
}

export interface EventCreate {
  feature_instance_id: string;
  title: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  document_content_html?: string;
  size?: number | null;
  force_on_dashboard?: boolean;
}

export interface EventUpdate {
  title?: string;
  start_at?: string;
  end_at?: string;
  all_day?: boolean;
  document_content_html?: string;
  size?: number | null;
  clear_size?: boolean;
  force_on_dashboard?: boolean;
}
