import { apiService } from '@/app/platform/core/api/api.service.ts';
import {
  CalendarEvent,
  EventCreate,
  EventUpdate,
  EventReminder,
  EventReminderCreate,
  FeatureLabel,
  FeatureLabelCreate,
  FeatureLabelUpdate,
  PersonOption,
  PlanningEvent,
} from './types.ts';

class EventsService {
  async listByInstance(featureInstanceId: string): Promise<CalendarEvent[]> {
    return apiService.get<CalendarEvent[]>(
      `/features/tasks/events/by-instance/${featureInstanceId}`,
    );
  }

  async listAccessible(): Promise<PlanningEvent[]> {
    return apiService.get<PlanningEvent[]>('/features/tasks/events/accessible');
  }

  async create(data: EventCreate): Promise<CalendarEvent> {
    return apiService.post<CalendarEvent>('/features/tasks/events/', data);
  }

  async update(eventId: string, data: EventUpdate): Promise<CalendarEvent> {
    return apiService.patch<CalendarEvent>(`/features/tasks/events/${eventId}`, data);
  }

  async delete(eventId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/events/${eventId}`);
  }

  async setParticipants(eventId: string, personIds: string[]): Promise<string[]> {
    return apiService.post<string[]>(
      `/features/tasks/events/${eventId}/participants`,
      personIds,
    );
  }

  async setReminders(eventId: string, reminders: EventReminderCreate[]): Promise<EventReminder[]> {
    return apiService.post<EventReminder[]>(
      `/features/tasks/events/${eventId}/reminders`,
      reminders,
    );
  }

  async toggleLabel(eventId: string, labelId: string): Promise<string[]> {
    return apiService.post<string[]>(
      `/features/tasks/events/${eventId}/labels/${labelId}`,
      {},
    );
  }

  async listPersons(featureInstanceId: string): Promise<PersonOption[]> {
    return apiService.get<PersonOption[]>(
      `/features/tasks/events/persons/${featureInstanceId}`,
    );
  }

  async listLabels(featureInstanceId: string): Promise<FeatureLabel[]> {
    return apiService.get<FeatureLabel[]>(
      `/features/tasks/event-labels/by-instance/${featureInstanceId}`,
    );
  }

  async createLabel(data: FeatureLabelCreate): Promise<FeatureLabel> {
    return apiService.post<FeatureLabel>('/features/tasks/event-labels/', data);
  }

  async updateLabel(labelId: string, data: FeatureLabelUpdate): Promise<FeatureLabel> {
    return apiService.patch<FeatureLabel>(`/features/tasks/event-labels/${labelId}`, data);
  }

  async deleteLabel(labelId: string): Promise<void> {
    return apiService.delete<void>(`/features/tasks/event-labels/${labelId}`);
  }
}

export const eventsService = new EventsService();
