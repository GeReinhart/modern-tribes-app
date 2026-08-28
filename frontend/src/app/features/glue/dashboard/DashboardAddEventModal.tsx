import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { eventsService } from '@/app/features/events/service.ts';
import EventCreateForm from '@/app/features/events/EventCreateForm.tsx';
import type { EventCreate, EventReminderCreate, FeatureLabel, FeatureLabelCreate, PersonOption } from '@/app/features/events/types.ts';
import type { ProjectFeatureInstance } from '@/app/features/tribes-projects/projects/project-features.types.ts';
import FeatureInstanceBadgePicker from './FeatureInstanceBadgePicker.tsx';
import { resolveQuickAddDefault, useQuickAddDefaults } from './useQuickAddDefaults.ts';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  selectedDate: string;
  onClose: () => void;
  onCreated: () => void;
}

const EVENT_FEATURE_TYPES = ['events'];

const DashboardAddEventModal: React.FC<Props> = ({ selectedDate, onClose, onCreated }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selectedInstance, setSelectedInstance] = useState<ProjectFeatureInstance | null>(null);
  const [persons, setPersons] = useState<PersonOption[]>([]);
  const [labels, setLabels] = useState<FeatureLabel[]>([]);
  const { data: quickAddDefaults } = useQuickAddDefaults();
  const preferredInstanceId = resolveQuickAddDefault(quickAddDefaults?.event);

  useEffect(() => {
    if (!selectedInstance) { setPersons([]); setLabels([]); return; }
    Promise.all([
      eventsService.listPersons(selectedInstance.id),
      eventsService.listLabels(selectedInstance.id),
    ]).then(([p, l]) => { setPersons(p); setLabels(l); });
  }, [selectedInstance]);

  const handleCreate = async (
    data: EventCreate,
    participantIds: string[],
    labelIds: string[],
    reminders: EventReminderCreate[],
  ) => {
    const created = await eventsService.create(data);
    if (participantIds.length) await eventsService.setParticipants(created.id, participantIds);
    if (reminders.length) await eventsService.setReminders(created.id, reminders);
    for (const lid of labelIds) await eventsService.toggleLabel(created.id, lid);
    onCreated();
    onClose();
  };

  const handleCreateLabel = async (data: FeatureLabelCreate): Promise<FeatureLabel | null> => {
    try { return await eventsService.createLabel(data); } catch { return null; }
  };

  const handleUpdateLabel = async (labelId: string, updates: { name?: string; color?: string }): Promise<void> => {
    await eventsService.updateLabel(labelId, updates);
  };

  const handleDeleteLabel = async (labelId: string): Promise<void> => {
    await eventsService.deleteLabel(labelId);
  };

  const handleReorderLabel = async (orderedIds: string[]): Promise<void> => {
    if (!selectedInstance) return;
    await eventsService.reorderLabels(selectedInstance.id, orderedIds);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '8px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{ backgroundColor: theme.colors.surface, borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.24)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: 'var(--font-lg)', color: theme.colors.text }}>
            <ThemedSvgIcon name="calendar" color={theme.colors.primary} size={20} />
            {t('features.events.addEvent')}
          </span>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <ThemedSvgIcon name="x" color={theme.colors.secondary} size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <FeatureInstanceBadgePicker
            featureTypes={EVENT_FEATURE_TYPES}
            selectedInstanceId={selectedInstance?.id ?? null}
            onSelect={setSelectedInstance}
            preferredInstanceId={preferredInstanceId}
          />

          {selectedInstance && (
            <EventCreateForm
              featureInstanceId={selectedInstance.id}
              selectedDate={selectedDate}
              persons={persons}
              labels={labels}
              isManager={false}
              onCreate={handleCreate}
              onCreateLabel={handleCreateLabel}
              onUpdateLabel={handleUpdateLabel}
              onDeleteLabel={handleDeleteLabel}
              onReorderLabel={handleReorderLabel}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAddEventModal;
