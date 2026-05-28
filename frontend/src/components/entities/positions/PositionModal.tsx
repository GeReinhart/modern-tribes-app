import {
  ModalBody,
  ThemedModal,
} from '@/platform/themes/components/ThemedModal.tsx';
import { FormMode } from '@/types/common.types.ts';
import {
  Position,
  PositionCreate,
  PositionUpdate,
} from '@/types/position.types.ts';

import React from 'react';

import { PositionForm } from './PositionForm.tsx';

interface PositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  position?: Position;
  mode: FormMode;
  onSubmit: (data: PositionCreate | PositionUpdate) => Promise<void>;
}

export const PositionModal: React.FC<PositionModalProps> = ({
  isOpen,
  onClose,
  position,
  mode,
  onSubmit,
}) => {
  const title =
    mode === 'create'
      ? 'Create Position'
      : mode === 'edit'
        ? 'Edit Position'
        : 'Position Details';

  const handleSubmit = async (data: PositionCreate | PositionUpdate) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <ModalBody>
        <PositionForm
          position={position}
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </ModalBody>
    </ThemedModal>
  );
};
