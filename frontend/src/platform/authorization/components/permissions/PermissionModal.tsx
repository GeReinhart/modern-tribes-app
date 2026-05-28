import {
  ModalBody,
  ThemedModal,
} from '@/platform/themes/layout/ThemedModal.tsx';
import { FormMode } from '@/types/common.types.ts';

import React from 'react';

import {
  Permission,
  PermissionCreate,
  PermissionUpdate,
} from '../../permission.types';
import { PermissionForm } from './PermissionForm.tsx';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission?: Permission;
  mode: FormMode;
  onSubmit: (data: PermissionCreate | PermissionUpdate) => Promise<void>;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onClose,
  permission,
  mode,
  onSubmit,
}) => {
  const titles = {
    create: 'Create New Permission',
    edit: 'Edit Permission',
    view: 'View Permission',
  };

  const handleSubmit = async (data: PermissionCreate | PermissionUpdate) => {
    await onSubmit(data);
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
        <PermissionForm
          permission={permission}
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </ModalBody>
    </ThemedModal>
  );
};
