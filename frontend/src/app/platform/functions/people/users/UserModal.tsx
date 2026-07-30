import {
  ModalBody,
  ThemedModal,
} from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { useRepresentsByUserId } from '@/app/platform/functions/people/represents/useRepresents.ts';
import { useSyncRepresentedPersons } from '@/app/platform/functions/people/represents/useSyncRepresentedPersons.ts';
import { FormMode } from '@/app/platform/core/common.types.ts';
import { User, UserCreate, UserUpdate } from '@/app/platform/functions/people/users/user.types.ts';

import React from 'react';

import { UserForm } from './UserForm.tsx';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
  mode: FormMode;
  onSubmit: (data: UserCreate | UserUpdate) => Promise<void>;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  user,
  mode,
  onSubmit,
}) => {
  const { represents, loading: representsLoading } = useRepresentsByUserId(
    user?.id ?? null,
  );
  const { syncRepresentedPersons } = useSyncRepresentedPersons();

  const initialRepresentPersonIds = representsLoading
    ? undefined
    : represents.map((r) => r.person_id);

  const titles = {
    create: 'Create New User',
    edit: 'Edit User',
    view: 'View User',
  };

  const handleSubmit = async (
    data: UserCreate | UserUpdate,
    representPersonIds: string[],
  ) => {
    await onSubmit(data);

    if (mode === 'edit' && user?.id) {
      await syncRepresentedPersons(user.id, represents, representPersonIds);
    }

    onClose();
  };

  return (
    <ThemedModal
      isOpen={isOpen}
      onClose={onClose}
      title={titles[mode]}
      size="md"
    >
      <ModalBody>
        <UserForm
          user={user}
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={onClose}
          initialRepresentPersonIds={initialRepresentPersonIds}
        />
      </ModalBody>
    </ThemedModal>
  );
};
