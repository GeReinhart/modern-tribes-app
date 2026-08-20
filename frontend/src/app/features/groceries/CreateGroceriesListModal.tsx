import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCheckbox } from '@/app/platform/core/layout/themes/components/ThemedCheckbox.tsx';
import ThemedDateSelection from '@/app/platform/core/layout/themes/components/ThemedDateSelection.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { SelectOption } from '@/app/platform/core/common.types.ts';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GroceriesListCreate, PersonOption } from './types.ts';

interface Props {
  featureInstanceId: string;
  persons: PersonOption[];
  onClose: () => void;
  onCreate: (data: GroceriesListCreate) => Promise<void>;
}

function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const CreateGroceriesListModal: React.FC<Props> = ({ featureInstanceId, persons, onClose, onCreate }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [scheduledDate, setScheduledDate] = useState(todayIsoDate());
  const [assignedPersonId, setAssignedPersonId] = useState('');
  const [forceOnDashboard, setForceOnDashboard] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const personOptions: SelectOption[] = persons.map((p) => ({ value: p.id, label: p.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onCreate({
      feature_instance_id: featureInstanceId,
      name: name.trim() || undefined,
      scheduled_date: scheduledDate,
      assigned_person_id: assignedPersonId || undefined,
      force_on_dashboard: forceOnDashboard,
    });
    setSubmitting(false);
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={t('features.groceries.newList')}>
      <form onSubmit={handleSubmit}>
        <ThemedModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ThemedInput
              label={t('features.groceries.listName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('features.groceries.listNamePlaceholder')}
            />
            <ThemedDateSelection
              label={t('features.groceries.scheduledDate')}
              value={scheduledDate}
              onChange={setScheduledDate}
            />
            <ThemedSelect
              label={t('features.groceries.assignedTo')}
              options={personOptions}
              value={assignedPersonId}
              placeholder={t('features.groceries.noAssignee')}
              onChange={setAssignedPersonId}
            />
            <ThemedCheckbox
              label={t('features.groceries.forceOnDashboard')}
              checked={forceOnDashboard}
              onChange={setForceOnDashboard}
            />
          </div>
        </ThemedModalBody>
        <ThemedModalFooter>
          <ThemedButton variant="ghost" type="button" onClick={onClose}>
            {t('features.groceries.cancel')}
          </ThemedButton>
          <ThemedButton variant="primary" type="submit" isLoading={submitting} disabled={!scheduledDate}>
            {t('features.groceries.create')}
          </ThemedButton>
        </ThemedModalFooter>
      </form>
    </ThemedModal>
  );
};

export default CreateGroceriesListModal;
