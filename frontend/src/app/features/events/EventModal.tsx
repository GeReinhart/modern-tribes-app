import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import TaskItemModalLabels from '@/app/features/tasks/TaskItemModalLabels.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  CalendarEvent,
  EventUpdate,
  EventReminderCreate,
  FeatureLabel,
  FeatureLabelCreate,
  PersonOption,
} from './types.ts';
import { isoToLocalDt } from './dateUtils.ts';
import EventModalReminders from './EventModalReminders.tsx';
import EventModalMeta from './EventModalMeta.tsx';

interface Props {
  event: CalendarEvent | null;
  labels: FeatureLabel[];
  persons: PersonOption[];
  canEdit: boolean;
  isManager: boolean;
  featureInstanceId: string;
  onClose: () => void;
  onUpdate: (id: string, data: EventUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSetParticipants: (id: string, personIds: string[]) => Promise<void>;
  onSetReminders: (id: string, reminders: EventReminderCreate[]) => Promise<void>;
  onToggleLabel: (id: string, labelId: string) => Promise<string[]>;
  onCreateLabel: (data: FeatureLabelCreate) => Promise<FeatureLabel | null>;
}

const EventModal: React.FC<Props> = ({
  event, labels, persons, canEdit, isManager, featureInstanceId,
  onClose, onUpdate, onDelete, onSetParticipants, onSetReminders, onToggleLabel, onCreateLabel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [title, setTitle] = useState(event?.title ?? '');
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [startAt, setStartAt] = useState(event?.start_at ? isoToLocalDt(event.start_at) : '');
  const [endAt, setEndAt] = useState(event?.end_at ? isoToLocalDt(event.end_at) : '');
  const [notes, setNotes] = useState(event?.document_content_html ?? '');
  const [size, setSize] = useState<number | null>(event?.size ?? null);
  const [forceOnDashboard, setForceOnDashboard] = useState(event?.force_on_dashboard ?? false);
  const [participantIds, setParticipantIds] = useState<string[]>(event?.participant_ids ?? []);
  const [reminders, setReminders] = useState<EventReminderCreate[]>(
    event?.reminders.map((r) => ({ remind_at: isoToLocalDt(r.remind_at), reminder_type: r.reminder_type })) ?? [],
  );
  const [localLabelIds, setLocalLabelIds] = useState<string[]>(event?.label_ids ?? []);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  if (!event) return null;

  const taskLabels = labels.map((l) => ({ ...l, feature_instance_id: featureInstanceId }));

  const handleSave = async () => {
    setSaving(true);
    const patch: EventUpdate = {};
    if (title.trim() !== event.title) patch.title = title.trim();
    if (allDay !== event.all_day) patch.all_day = allDay;
    if (startAt) patch.start_at = new Date(startAt).toISOString();
    if (endAt) patch.end_at = new Date(endAt).toISOString();
    if (notes !== (event.document_content_html ?? '')) patch.document_content_html = notes;
    if (size !== event.size) {
      if (size === null) patch.clear_size = true;
      else patch.size = size;
    }
    if (forceOnDashboard !== (event.force_on_dashboard ?? false)) patch.force_on_dashboard = forceOnDashboard;
    if (Object.keys(patch).length > 0) await onUpdate(event.id, patch);
    await onSetParticipants(event.id, participantIds);
    await onSetReminders(
      event.id,
      reminders.map((r) => ({ ...r, remind_at: new Date(r.remind_at).toISOString() })),
    );
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    setSaving(true);
    await onDelete(event.id);
    setSaving(false);
    onClose();
  };

  const handleToggle = async (labelId: string) => {
    const was = localLabelIds.includes(labelId);
    setLocalLabelIds((prev) => (was ? prev.filter((id) => id !== labelId) : [...prev, labelId]));
    try {
      const updated = await onToggleLabel(event.id, labelId);
      setLocalLabelIds(updated);
    } catch {
      setLocalLabelIds((prev) => (was ? [...prev, labelId] : prev.filter((id) => id !== labelId)));
    }
  };

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
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '8px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ position: 'relative', backgroundColor: theme.colors.surface, borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.24)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-lg)', color: theme.colors.text }}>
            {isEditing ? t('features.events.editEvent') : t('features.events.viewEvent')}
          </span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondary }}>
            <ThemedSvgIcon name="x" color="currentColor" size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={sectionLabel}>{t('features.events.title')}</div>
            {isEditing ? (
              <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
            ) : (
              <span style={{ color: theme.colors.text }}>{event.title}</span>
            )}
          </div>

          <EventModalMeta
            allDay={allDay} startAt={startAt} endAt={endAt}
            persons={persons} participantIds={participantIds}
            size={size} canEdit={isEditing}
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
              canEdit={isEditing}
              canCreateLabel={isManager && isEditing}
              featureInstanceId={featureInstanceId}
              onToggle={handleToggle}
              onCreateLabel={onCreateLabel as Parameters<typeof TaskItemModalLabels>[0]['onCreateLabel']}
              onLabelCreated={(label) => setLocalLabelIds((prev) => [...prev, label.id])}
            />
          </div>

          <EventModalReminders
            reminders={reminders}
            canEdit={isEditing}
            onChange={setReminders}
            eventStartAt={startAt}
            eventEndAt={endAt}
            eventTitle={title}
          />

          <div>
            <div style={sectionLabel}>{t('features.events.notes')}</div>
            {isEditing ? (
              <EditorJoditComponent content={notes} onChange={setNotes} />
            ) : notes ? (
              <div dangerouslySetInnerHTML={{ __html: notes }} style={{ fontSize: 'var(--font-sm)', color: theme.colors.text }} />
            ) : (
              <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>{t('features.events.noNotes')}</span>
            )}
          </div>

          {isEditing ? (
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
          ) : forceOnDashboard ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-xs)', color: theme.colors.primary, fontWeight: 600 }}>
              <span>📌</span>
              <span>{t('common.forceOnDashboard')}</span>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          <div>
            {isEditing && (
              <ThemedButton variant="danger" onClick={() => setConfirming(true)} disabled={saving}>
                {t('features.events.delete')}
              </ThemedButton>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isEditing ? (
              <>
                <ThemedButton variant="secondary" onClick={() => setIsEditing(false)} disabled={saving}>{t('common.cancel')}</ThemedButton>
                <ThemedButton variant="primary" onClick={handleSave} disabled={saving}>{t('common.save')}</ThemedButton>
              </>
            ) : (
              <>
                <ThemedButton variant="ghost" onClick={onClose}>{t('common.close')}</ThemedButton>
                {canEdit && <ThemedButton variant="primary" onClick={() => setIsEditing(true)}>{t('common.edit')}</ThemedButton>}
              </>
            )}
          </div>
        </div>

        {confirming && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: '12px', backgroundColor: theme.colors.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '32px' }}>
            <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: theme.colors.text, textAlign: 'center' }}>
              {t('features.events.confirmDelete')}
            </span>
            <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary, textAlign: 'center' }}>
              {event.title}
            </span>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <ThemedButton variant="secondary" onClick={() => setConfirming(false)} disabled={saving}>{t('common.cancel')}</ThemedButton>
              <ThemedButton variant="danger" onClick={handleDelete} disabled={saving}>{t('features.events.delete')}</ThemedButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventModal;
