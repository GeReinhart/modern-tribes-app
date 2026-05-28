import {
  ModalBody,
  ThemedModal,
} from '@/platform/themes/layout/ThemedModal.tsx';
import { FormMode } from '@/types/common.types.ts';
import { Person, PersonCreate, PersonUpdate } from '@/types/person.types.ts';

import React from 'react';

import { PersonForm } from './PersonForm.tsx';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  person?: Person;
  mode: FormMode;
  onSubmit: (data: PersonCreate | PersonUpdate) => Promise<void>;
}

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  onClose,
  person,
  mode,
  onSubmit,
}) => {
  const title =
    mode === 'create'
      ? 'Create Person'
      : mode === 'edit'
        ? 'Edit Person'
        : 'Person Details';

  const handleSubmit = async (data: PersonCreate | PersonUpdate) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <ModalBody>
        <PersonForm
          person={person}
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </ModalBody>
    </ThemedModal>
  );
};
