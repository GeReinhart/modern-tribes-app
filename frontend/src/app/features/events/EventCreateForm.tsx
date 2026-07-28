import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ColorSwatchPicker } from '@/app/platform/core/layout/themes/components/ColorSwatchPicker.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { LABEL_COLORS } from '@/app/platform/core/layout/themes/themes.ts';
import TaskItemModalLabels from '@/app/features/tasks/TaskItemModalLabels.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import EventForceOnDashboardField from './EventForceOnDashboardField.tsx';
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
  const [multiDay, setMultiDay] = useState(false);
  const [startAt, setStartAt] = useState(selectedDate + 'T09:00');
  const [endAt, setEndAt] = useState(selectedDate + 'T10:00');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [size, setSize] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(LABEL_COLORS[0]);
  const [forceOnDashboard, setForceOnDashboard] = useState(false);
  const [localLabelIds, setLocalLabelIds] = useState<string[]>([]);
  const [reminders, setReminders] = useState<EventReminderCreate[]>(() =>
    buildDefaultReminders(selectedDate + 'T09:00'),
  );

  const taskLabels = labels.map((l) => ({ ...l, feature_instance_id: featureInstanceId }));

  const handleMultiDayChange = (v: boolean) => {
    setMultiDay(v);
    if (!v) setEndAt(startAt.slice(0, 10) + 'T' + endAt.slice(11, 16));
  };

  const handleToggleLabel = (labelId: string) => {
    setLocalLabelIds((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const data: EventCreate = {
      feature_instance_id: featureInstanceId,
      title: title.trim(),
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      all_day: allDay,
      color,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input
        placeholder={t('features.events.titlePlaceholder')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        style={inputStyle}
        autoFocus
      />

      <EventModalMeta
        allDay={allDay} multiDay={multiDay} startAt={startAt} endAt={endAt}
        persons={persons} participantIds={participantIds}
        size={size} canEdit={true}
        onAllDayChange={setAllDay}
        onMultiDayChange={handleMultiDayChange}
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

      <div>
        <div style={sectionLabel}>{t('features.events.color')}</div>
        <ColorSwatchPicker colors={LABEL_COLORS} value={color} onChange={setColor} />
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

      <EventForceOnDashboardField value={forceOnDashboard} canEdit={true} onChange={setForceOnDashboard} />

      <div style={{ display: 'flex', gap: '8px' }}>
        <ThemedButton variant="primary" type="button" onClick={handleSubmit} disabled={!title.trim()}>{t('features.events.create')}</ThemedButton>
        <ThemedButton variant="secondary" type="button" onClick={onCancel}>{t('common.cancel')}</ThemedButton>
      </div>
    </div>
  );
};

export default EventCreateForm;
