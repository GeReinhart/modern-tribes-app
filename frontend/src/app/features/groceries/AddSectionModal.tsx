import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCheckbox } from '@/app/platform/core/layout/themes/components/ThemedCheckbox.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import GroceriesIconPickerField from './GroceriesIconPickerField.tsx';

interface Props {
  title: string;
  submitLabel: string;
  initialName?: string;
  initialIcon?: string | null;
  initialIsFood?: boolean;
  onClose: () => void;
  onSubmit: (name: string, icon: string | null, isFood: boolean) => Promise<void>;
}

const AddSectionModal: React.FC<Props> = ({
  title, submitLabel, initialName, initialIcon, initialIsFood, onClose, onSubmit,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName ?? '');
  const [icon, setIcon] = useState<string | null>(initialIcon ?? null);
  const [isFood, setIsFood] = useState(initialIsFood ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await onSubmit(name.trim(), icon, isFood);
    setSubmitting(false);
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={title}>
      <form onSubmit={handleSubmit}>
        <ThemedModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ThemedInput
              label={t('features.groceries.sectionName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('features.groceries.sectionNamePlaceholder')}
              autoFocus
            />
            <GroceriesIconPickerField value={icon} onChange={setIcon} />
            <ThemedCheckbox
              label={t('features.groceries.isFoodSection')}
              helperText={t('features.groceries.isFoodSectionHelp')}
              checked={isFood}
              onChange={setIsFood}
            />
          </div>
        </ThemedModalBody>
        <ThemedModalFooter>
          <ThemedButton variant="ghost" type="button" onClick={onClose}>
            {t('features.groceries.cancel')}
          </ThemedButton>
          <ThemedButton variant="primary" type="submit" isLoading={submitting} disabled={!name.trim()}>
            {submitLabel}
          </ThemedButton>
        </ThemedModalFooter>
      </form>
    </ThemedModal>
  );
};

export default AddSectionModal;
