import { useCallback, useEffect, useRef, useState } from 'react';
import { eventsService } from './service.ts';
import {
  CalendarEvent,
  EventCreate,
  EventUpdate,
  EventReminderCreate,
  FeatureLabel,
  FeatureLabelCreate,
  FeatureLabelUpdate,
  PersonOption,
} from './types.ts';

const POLL_INTERVAL_MS = 10_000;

export function useEvents(featureInstanceId: string | null) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [labels, setLabels] = useState<FeatureLabel[]>([]);
  const [persons, setPersons] = useState<PersonOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!featureInstanceId) return;
    try {
      setEvents(await eventsService.listByInstance(featureInstanceId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, [featureInstanceId]);

  const fetchStatic = useCallback(async () => {
    if (!featureInstanceId) return;
    try {
      const [lbls, prsns] = await Promise.all([
        eventsService.listLabels(featureInstanceId),
        eventsService.listPersons(featureInstanceId),
      ]);
      setLabels(lbls);
      setPersons(prsns);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, [featureInstanceId]);

  useEffect(() => {
    if (!featureInstanceId) return;
    fetchEvents();
    fetchStatic();
    intervalRef.current = setInterval(fetchEvents, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [featureInstanceId, fetchEvents, fetchStatic]);

  const createEvent = useCallback(async (data: EventCreate): Promise<CalendarEvent | null> => {
    try {
      const created = await eventsService.create(data);
      setEvents((prev) => [...prev, created]);
      return created;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
      return null;
    }
  }, []);

  const updateEvent = useCallback(async (eventId: string, data: EventUpdate): Promise<void> => {
    try {
      const updated = await eventsService.update(eventId, data);
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    try {
      await eventsService.delete(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, []);

  const setParticipants = useCallback(
    async (eventId: string, personIds: string[]): Promise<void> => {
      try {
        await eventsService.setParticipants(eventId, personIds);
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, participant_ids: personIds } : e)),
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
      }
    },
    [],
  );

  const setReminders = useCallback(
    async (eventId: string, reminders: EventReminderCreate[]): Promise<void> => {
      try {
        const updated = await eventsService.setReminders(eventId, reminders);
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, reminders: updated } : e)),
        );
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
      }
    },
    [],
  );

  const toggleLabel = useCallback(async (eventId: string, labelId: string): Promise<string[]> => {
    try {
      const newLabelIds = await eventsService.toggleLabel(eventId, labelId);
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, label_ids: newLabelIds } : e)),
      );
      return newLabelIds;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
      return [];
    }
  }, []);

  const createLabel = useCallback(
    async (data: FeatureLabelCreate): Promise<FeatureLabel | null> => {
      try {
        const label = await eventsService.createLabel(data);
        setLabels((prev) => [...prev, label]);
        return label;
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
        return null;
      }
    },
    [],
  );

  const updateLabel = useCallback(
    async (labelId: string, data: FeatureLabelUpdate): Promise<void> => {
      try {
        await eventsService.updateLabel(labelId, data);
        setLabels((prev) => prev.map((l) => (l.id === labelId ? { ...l, ...data } : l)));
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error');
      }
    },
    [],
  );

  const deleteLabel = useCallback(async (labelId: string): Promise<void> => {
    try {
      await eventsService.deleteLabel(labelId);
      setLabels((prev) => prev.filter((l) => l.id !== labelId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, []);

  return {
    events,
    labels,
    persons,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    setParticipants,
    setReminders,
    toggleLabel,
    createLabel,
    updateLabel,
    deleteLabel,
    refetch: fetchEvents,
  };
}
