import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import ThemedDateSelection from '@/app/platform/core/layout/themes/components/ThemedDateSelection.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  initialName: string;
  initialScheduledDate: string | null;
  onClose: () => void;
  onSubmit: (data: { name?: string; scheduled_date?: string; clear_scheduled_date?: boolean }) => Promise<boolean>;
}

const EditListModal: React.FC<Props> = ({ initialName, initialScheduledDate, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [scheduledDate, setScheduledDate] = useState(initialScheduledDate ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await onSubmit({
      name: name.trim(),
      ...(scheduledDate ? { scheduled_date: scheduledDate } : { clear_scheduled_date: true }),
    });
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={t('features.groceries.editList')}>
      <form onSubmit={handleSubmit}>
        <ThemedModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ThemedInput
              label={t('features.groceries.listName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('features.groceries.listNamePlaceholder')}
              autoFocus
            />
            <ThemedDateSelection
              label={t('features.groceries.scheduledDate')}
              value={scheduledDate}
              onChange={setScheduledDate}
            />
          </div>
        </ThemedModalBody>
        <ThemedModalFooter>
          <ThemedButton variant="ghost" type="button" onClick={onClose}>
            {t('features.groceries.cancel')}
          </ThemedButton>
          <ThemedButton variant="primary" type="submit" isLoading={submitting}>
            {t('features.groceries.save')}
          </ThemedButton>
        </ThemedModalFooter>
      </form>
    </ThemedModal>
  );
};

export default EditListModal;
