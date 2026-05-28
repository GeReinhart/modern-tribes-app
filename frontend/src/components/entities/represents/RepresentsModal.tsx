import {
  ModalBody,
  ThemedModal,
} from '@/platform/themes/layout/ThemedModal.tsx';
import { FormMode } from '@/types/common.types.ts';
import {
  Represents,
  RepresentsCreate,
  RepresentsUpdate,
} from '@/types/represents.types.ts';

import React from 'react';

import { RepresentsForm } from './RepresentsForm.tsx';

interface RepresentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  represents?: Represents;
  mode: FormMode;
  onSubmit: (data: RepresentsCreate | RepresentsUpdate) => Promise<void>;
}

export const RepresentsModal: React.FC<RepresentsModalProps> = ({
  isOpen,
  onClose,
  represents,
  mode,
  onSubmit,
}) => {
  const title =
    mode === 'create'
      ? 'Create Represents'
      : mode === 'edit'
        ? 'Edit Represents'
        : 'Represents Details';

  const handleSubmit = async (data: RepresentsCreate | RepresentsUpdate) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <ModalBody>
        <RepresentsForm
          represents={represents}
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </ModalBody>
    </ThemedModal>
  );
};
