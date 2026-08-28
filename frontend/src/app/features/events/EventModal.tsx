import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

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
import EventDeleteConfirm from './EventDeleteConfirm.tsx';
import EventModalFields from './EventModalFields.tsx';

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
  onUpdateLabel: (labelId: string, updates: { name?: string; color?: string }) => Promise<void>;
  onDeleteLabel: (labelId: string) => Promise<void>;
  onReorderLabel: (orderedIds: string[]) => Promise<void>;
}

const EventModal: React.FC<Props> = ({
  event, labels, persons, canEdit, isManager, featureInstanceId,
  onClose, onUpdate, onDelete, onSetParticipants, onSetReminders, onToggleLabel, onCreateLabel,
  onUpdateLabel, onDeleteLabel, onReorderLabel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [title, setTitle] = useState(event?.title ?? '');
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [startAt, setStartAt] = useState(event?.start_at ? isoToLocalDt(event.start_at) : '');
  const [endAt, setEndAt] = useState(event?.end_at ? isoToLocalDt(event.end_at) : '');
  const [multiDay, setMultiDay] = useState(
    !!event && !event.all_day && isoToLocalDt(event.start_at).slice(0, 10) !== isoToLocalDt(event.end_at).slice(0, 10),
  );
  const [notes, setNotes] = useState(event?.document_content_html ?? '');
  const [size, setSize] = useState<number | null>(event?.size ?? null);
  const [color, setColor] = useState(event?.color ?? '#6b7280');
  const [forceOnDashboard, setForceOnDashboard] = useState(event?.force_on_dashboard ?? false);
  const [participantIds, setParticipantIds] = useState<string[]>(event?.participant_ids ?? []);
  const [reminders, setReminders] = useState<EventReminderCreate[]>(
    event?.reminders.map((r) => ({ remind_at: isoToLocalDt(r.remind_at), reminder_type: r.reminder_type })) ?? [],
  );
  const [localLabelIds, setLocalLabelIds] = useState<string[]>(event?.label_ids ?? []);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  // EventModal is only ever opened from an explicit "edit" action (the
  // read-only case is handled separately by EventViewModal), so it should
  // start in edit mode rather than force a redundant second click.
  const [isEditing, setIsEditing] = useState(true);

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
    if (color !== event.color) patch.color = color;
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

  const handleMultiDayChange = (v: boolean) => {
    setMultiDay(v);
    if (!v) setEndAt(startAt.slice(0, 10) + 'T' + endAt.slice(11, 16));
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

        <EventModalFields
          event={event}
          isEditing={isEditing}
          title={title}
          onTitleChange={setTitle}
          allDay={allDay} multiDay={multiDay} startAt={startAt} endAt={endAt}
          onAllDayChange={setAllDay}
          onMultiDayChange={handleMultiDayChange}
          onStartAtChange={setStartAt}
          onEndAtChange={setEndAt}
          persons={persons}
          participantIds={participantIds}
          onParticipantsChange={setParticipantIds}
          size={size}
          onSizeChange={setSize}
          taskLabels={taskLabels}
          localLabelIds={localLabelIds}
          isManager={isManager}
          featureInstanceId={featureInstanceId}
          onToggleLabel={handleToggle}
          onCreateLabel={onCreateLabel}
          onLabelCreated={(label) => setLocalLabelIds((prev) => [...prev, label.id])}
          onUpdateLabel={onUpdateLabel}
          onDeleteLabel={onDeleteLabel}
          onReorderLabel={onReorderLabel}
          onLabelDeleted={(labelId) => setLocalLabelIds((prev) => prev.filter((id) => id !== labelId))}
          color={color}
          onColorChange={setColor}
          reminders={reminders}
          onRemindersChange={setReminders}
          notes={notes}
          onNotesChange={setNotes}
          forceOnDashboard={forceOnDashboard}
          onForceOnDashboardChange={setForceOnDashboard}
        />

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
          <EventDeleteConfirm
            eventTitle={event.title}
            saving={saving}
            onCancel={() => setConfirming(false)}
            onConfirm={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

export default EventModal;
