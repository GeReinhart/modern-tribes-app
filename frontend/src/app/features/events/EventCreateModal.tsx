import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import EventCreateForm from './EventCreateForm.tsx';
import type { EventCreate, EventReminderCreate, FeatureLabel, FeatureLabelCreate, PersonOption } from './types.ts';

interface Props {
  featureInstanceId: string;
  selectedDate: string;
  persons: PersonOption[];
  labels: FeatureLabel[];
  isManager: boolean;
  onCreate: (data: EventCreate, participantIds: string[], labelIds: string[], reminders: EventReminderCreate[]) => Promise<void>;
  onCreateLabel: (data: FeatureLabelCreate) => Promise<FeatureLabel | null>;
  onClose: () => void;
}

const EventCreateModal: React.FC<Props> = ({
  featureInstanceId, selectedDate, persons, labels, isManager,
  onCreate, onCreateLabel, onClose,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

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
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondary }}>
            <ThemedSvgIcon name="x" color="currentColor" size={20} />
          </button>
        </div>
        <EventCreateForm
          featureInstanceId={featureInstanceId}
          selectedDate={selectedDate}
          persons={persons}
          labels={labels}
          isManager={isManager}
          onCreate={onCreate}
          onCreateLabel={onCreateLabel}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default EventCreateModal;
