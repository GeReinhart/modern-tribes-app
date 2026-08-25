import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  initialName: string;
  onClose: () => void;
  onSubmit: (name: string) => Promise<boolean>;
}

const RenameListModal: React.FC<Props> = ({ initialName, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const ok = await onSubmit(name.trim());
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={t('features.groceries.renameList')}>
      <form onSubmit={handleSubmit}>
        <ThemedModalBody>
          <ThemedInput
            label={t('features.groceries.listName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('features.groceries.listNamePlaceholder')}
            autoFocus
          />
        </ThemedModalBody>
        <ThemedModalFooter>
          <ThemedButton variant="ghost" type="button" onClick={onClose}>
            {t('features.groceries.cancel')}
          </ThemedButton>
          <ThemedButton variant="primary" type="submit" isLoading={submitting} disabled={!name.trim()}>
            {t('features.groceries.save')}
          </ThemedButton>
        </ThemedModalFooter>
      </form>
    </ThemedModal>
  );
};

export default RenameListModal;
