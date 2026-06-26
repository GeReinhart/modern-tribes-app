import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import TaskItemModalLabels from '@/app/features/tasks/TaskItemModalLabels.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import EventModalMeta from './EventModalMeta.tsx';
import EventModalReminders from './EventModalReminders.tsx';
import type { EventCreate, EventReminderCreate, FeatureLabel, FeatureLabelCreate, PersonOption } from './types.ts';

interface Props {
  featureInstanceId: string;
  selectedDate: string;
  persons: PersonOption[];
  labels: FeatureLabel[];
  isManager: boolean;
  onCreate: (data: EventCreate, participantIds: string[], labelIds: string[], reminders: EventReminderCreate[]) => Promise<void>;
  onCreateLabel: (data: FeatureLabelCreate) => Promise<FeatureLabel | null>;
  onCancel: () => void;
}

function toLocalDt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function buildDefaultReminders(startAt: string): EventReminderCreate[] {
  const reminders: EventReminderCreate[] = [
    { remind_at: startAt, reminder_type: 'notification' },
  ];
  const before = new Date(startAt);
  before.setHours(before.getHours() - 24);
  if (before > new Date()) {
    reminders.push({ remind_at: toLocalDt(before), reminder_type: 'notification' });
  }
  return reminders;
}

const EventCreateForm: React.FC<Props> = ({
  featureInstanceId, selectedDate, persons, labels, isManager,
  onCreate, onCreateLabel, onCancel,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [allDay, setAllDay] = useState(false);
  const [startAt, setStartAt] = useState(selectedDate + 'T09:00');
  const [endAt, setEndAt] = useState(selectedDate + 'T10:00');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [size, setSize] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [forceOnDashboard, setForceOnDashboard] = useState(false);
  const [localLabelIds, setLocalLabelIds] = useState<string[]>([]);
  const [reminders, setReminders] = useState<EventReminderCreate[]>(() =>
    buildDefaultReminders(selectedDate + 'T09:00'),
  );

  const taskLabels = labels.map((l) => ({ ...l, feature_instance_id: featureInstanceId }));

  const handleToggleLabel = (labelId: string) => {
    setLocalLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const data: EventCreate = {
      feature_instance_id: featureInstanceId,
      title: title.trim(),
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      all_day: allDay,
      force_on_dashboard: forceOnDashboard,
    };
    if (notes.trim()) data.document_content_html = notes;
    if (size !== null) data.size = size;
    const remindersForApi = reminders.map((r) => ({
      ...r,
      remind_at: new Date(r.remind_at).toISOString(),
    }));
    await onCreate(data, participantIds, localLabelIds, remindersForApi);
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px', border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px', backgroundColor: theme.colors.surface,
    color: theme.colors.text, fontSize: 'var(--font-sm)', width: '100%', boxSizing: 'border-box',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    color: theme.colors.secondary, marginBottom: '6px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input placeholder={t('features.events.titlePlaceholder')} value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} autoFocus />

      <EventModalMeta
        allDay={allDay} startAt={startAt} endAt={endAt}
        persons={persons} participantIds={participantIds}
        size={size} canEdit={true}
        onAllDayChange={setAllDay}
        onStartAtChange={setStartAt}
        onEndAtChange={setEndAt}
        onParticipantsChange={setParticipantIds}
        onSizeChange={setSize}
      />

      <div>
        <div style={sectionLabel}>{t('features.events.labels')}</div>
        <TaskItemModalLabels
          labels={taskLabels}
          activeIds={localLabelIds}
          canEdit={true}
          canCreateLabel={isManager}
          featureInstanceId={featureInstanceId}
          onToggle={handleToggleLabel}
          onCreateLabel={onCreateLabel as Parameters<typeof TaskItemModalLabels>[0]['onCreateLabel']}
          onLabelCreated={(label) => setLocalLabelIds((prev) => [...prev, label.id])}
        />
      </div>

      <EventModalReminders
        reminders={reminders}
        canEdit={true}
        onChange={setReminders}
        eventStartAt={startAt}
        eventEndAt={endAt}
        eventTitle={title}
      />

      <div>
        <div style={sectionLabel}>{t('features.events.notes')}</div>
        <EditorJoditComponent content={notes} onChange={setNotes} compact={true} minHeight={200} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
        <input
          type="checkbox"
          checked={forceOnDashboard}
          onChange={(e) => setForceOnDashboard(e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: theme.colors.primary, cursor: 'pointer' }}
        />
        <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.text, fontWeight: 600 }}>
          {t('common.forceOnDashboard')}
        </span>
      </label>

      <div style={{ display: 'flex', gap: '8px' }}>
        <ThemedButton variant="primary" type="submit" disabled={!title.trim()}>{t('features.events.create')}</ThemedButton>
        <ThemedButton variant="secondary" type="button" onClick={onCancel}>{t('common.cancel')}</ThemedButton>
      </div>
    </form>
  );
};

export default EventCreateForm;
