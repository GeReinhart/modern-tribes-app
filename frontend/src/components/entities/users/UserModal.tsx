import {
  ModalBody,
  ThemedModal,
} from '@/components/common/layout/ThemedModal.tsx';
import {
  useRepresentsByUserId,
  useRepresentsMutations,
} from '@/hooks/useRepresents.ts';
import { FormMode } from '@/types/common.types.ts';
import { User, UserCreate, UserUpdate } from '@/types/user.types.ts';

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
  const { createRepresents, deleteRepresents } = useRepresentsMutations();

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
      const existingIds = represents.map((r) => r.person_id);
      const toAdd = representPersonIds.filter(
        (id) => !existingIds.includes(id),
      );
      const toRemove = represents.filter(
        (r) => !representPersonIds.includes(r.person_id),
      );
      await Promise.all([
        ...toAdd.map((pid) =>
          createRepresents({
            user_id: user.id!,
            person_id: pid,
            status: 'active',
          }),
        ),
        ...toRemove.map((r) => deleteRepresents(r.id)),
      ]);
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
