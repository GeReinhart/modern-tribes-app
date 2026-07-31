import {
  ModalBody,
  ThemedModal,
} from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { ChordForm } from './ChordForm.tsx';
import { GuitarChord, GuitarChordCreate } from './types.ts';

interface ChordFormModalProps {
  isOpen: boolean;
  chord?: GuitarChord;
  onClose: () => void;
  onSubmit: (data: GuitarChordCreate) => Promise<void>;
}

export const ChordFormModal: React.FC<ChordFormModalProps> = ({
  isOpen,
  chord,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();

  const handleSubmit = async (data: GuitarChordCreate) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <ThemedModal
      isOpen={isOpen}
      onClose={onClose}
      title={chord ? t('guitarChords.form.editTitle') : t('guitarChords.form.addTitle')}
      size="md"
    >
      <ModalBody>
        <ChordForm chord={chord} onSubmit={handleSubmit} onCancel={onClose} />
      </ModalBody>
    </ThemedModal>
  );
};
