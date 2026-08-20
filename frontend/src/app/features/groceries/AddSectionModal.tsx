import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import GroceriesIconPicker from './GroceriesIconPicker.tsx';

interface Props {
  title: string;
  submitLabel: string;
  initialName?: string;
  initialIcon?: string | null;
  onClose: () => void;
  onSubmit: (name: string, icon: string | null) => Promise<void>;
}

const AddSectionModal: React.FC<Props> = ({ title, submitLabel, initialName, initialIcon, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName ?? '');
  const [icon, setIcon] = useState<string | null>(initialIcon ?? null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await onSubmit(name.trim(), icon);
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
            <div>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 500, marginBottom: '8px' }}>
                {t('features.groceries.iconLabel')}
              </div>
              <GroceriesIconPicker value={icon} onChange={setIcon} />
            </div>
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
