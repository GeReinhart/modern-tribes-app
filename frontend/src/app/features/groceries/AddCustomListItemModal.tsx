import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  onClose: () => void;
  onSubmit: (name: string, unit: string) => Promise<void>;
}

const AddCustomListItemModal: React.FC<Props> = ({ onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await onSubmit(name.trim(), unit.trim());
    setSubmitting(false);
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={t('features.groceries.addCustomItem')}>
      <form onSubmit={handleSubmit}>
        <ThemedModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ThemedInput
              label={t('features.groceries.customItemName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('features.groceries.customItemNamePlaceholder')}
              autoFocus
            />
            <ThemedInput
              label={t('features.groceries.customItemUnit')}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={t('features.groceries.customItemUnitPlaceholder')}
            />
          </div>
        </ThemedModalBody>
        <ThemedModalFooter>
          <ThemedButton variant="ghost" type="button" onClick={onClose}>
            {t('features.groceries.cancel')}
          </ThemedButton>
          <ThemedButton variant="primary" type="submit" isLoading={submitting} disabled={!name.trim()}>
            {t('features.groceries.create')}
          </ThemedButton>
        </ThemedModalFooter>
      </form>
    </ThemedModal>
  );
};

export default AddCustomListItemModal;
