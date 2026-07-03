import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import TaskItemModalLabels from '@/app/features/tasks/TaskItemModalLabels.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import EventForceOnDashboardField from './EventForceOnDashboardField.tsx';
import EventModalMeta from './EventModalMeta.tsx';
import EventModalReminders from './EventModalReminders.tsx';
import type { TaskLabelInfo } from '@/app/features/tasks/types.ts';
import type {
  CalendarEvent,
  EventReminderCreate,
  FeatureLabel,
  FeatureLabelCreate,
  PersonOption,
} from './types.ts';

interface Props {
  event: CalendarEvent;
  isEditing: boolean;
  title: string;
  onTitleChange: (v: string) => void;
  allDay: boolean;
  multiDay: boolean;
  startAt: string;
  endAt: string;
  onAllDayChange: (v: boolean) => void;
  onMultiDayChange: (v: boolean) => void;
  onStartAtChange: (v: string) => void;
  onEndAtChange: (v: string) => void;
  persons: PersonOption[];
  participantIds: string[];
  onParticipantsChange: (ids: string[]) => void;
  size: number | null;
  onSizeChange: (v: number | null) => void;
  taskLabels: (FeatureLabel & { feature_instance_id: string })[];
  localLabelIds: string[];
  isManager: boolean;
  featureInstanceId: string;
  onToggleLabel: (labelId: string) => void;
  onCreateLabel: (data: FeatureLabelCreate) => Promise<FeatureLabel | null>;
  onLabelCreated: (label: TaskLabelInfo) => void;
  reminders: EventReminderCreate[];
  onRemindersChange: (r: EventReminderCreate[]) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  forceOnDashboard: boolean;
  onForceOnDashboardChange: (v: boolean) => void;
}

const EventModalFields: React.FC<Props> = ({
  event, isEditing, title, onTitleChange,
  allDay, multiDay, startAt, endAt, onAllDayChange, onMultiDayChange, onStartAtChange, onEndAtChange,
  persons, participantIds, onParticipantsChange, size, onSizeChange,
  taskLabels, localLabelIds, isManager, featureInstanceId, onToggleLabel, onCreateLabel, onLabelCreated,
  reminders, onRemindersChange, notes, onNotesChange,
  forceOnDashboard, onForceOnDashboardChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    border: `1px solid ${theme.colors.border}`, borderRadius: '8px',
    backgroundColor: theme.colors.surface, color: theme.colors.text,
    fontSize: 'var(--font-sm)', boxSizing: 'border-box',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
    color: theme.colors.secondary, marginBottom: '6px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div style={sectionLabel}>{t('features.events.title')}</div>
        {isEditing ? (
          <input value={title} onChange={(e) => onTitleChange(e.target.value)} style={inputStyle} />
        ) : (
          <span style={{ color: theme.colors.text }}>{event.title}</span>
        )}
      </div>

      <EventModalMeta
        allDay={allDay} multiDay={multiDay} startAt={startAt} endAt={endAt}
        persons={persons} participantIds={participantIds}
        size={size} canEdit={isEditing}
        onAllDayChange={onAllDayChange}
        onMultiDayChange={onMultiDayChange}
        onStartAtChange={onStartAtChange}
        onEndAtChange={onEndAtChange}
        onParticipantsChange={onParticipantsChange}
        onSizeChange={onSizeChange}
      />

      <div>
        <div style={sectionLabel}>{t('features.events.labels')}</div>
        <TaskItemModalLabels
          labels={taskLabels}
          activeIds={localLabelIds}
          canEdit={isEditing}
          canCreateLabel={isManager && isEditing}
          featureInstanceId={featureInstanceId}
          onToggle={onToggleLabel}
          onCreateLabel={onCreateLabel as Parameters<typeof TaskItemModalLabels>[0]['onCreateLabel']}
          onLabelCreated={onLabelCreated}
        />
      </div>

      <EventModalReminders
        reminders={reminders}
        canEdit={isEditing}
        onChange={onRemindersChange}
        eventStartAt={startAt}
        eventEndAt={endAt}
        eventTitle={title}
      />

      <div>
        <div style={sectionLabel}>{t('features.events.notes')}</div>
        {isEditing ? (
          <EditorJoditComponent content={notes} onChange={onNotesChange} />
        ) : notes ? (
          <div dangerouslySetInnerHTML={{ __html: notes }} style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }} />
        ) : (
          <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>{t('features.events.noNotes')}</span>
        )}
      </div>

      <EventForceOnDashboardField value={forceOnDashboard} canEdit={isEditing} onChange={onForceOnDashboardChange} />
    </div>
  );
};

export default EventModalFields;
