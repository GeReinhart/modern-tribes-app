import {
  ModalBody,
  ThemedModal,
} from '@/platform/themes/layout/ThemedModal.tsx';
import { FormMode } from '@/types/common.types.ts';
import {
  Project,
  ProjectCreate,
  ProjectUpdate,
} from '@/types/project.types.ts';

import React from 'react';

import { ProjectForm } from './ProjectForm.tsx';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
  mode: FormMode;
  onSubmit: (data: ProjectCreate | ProjectUpdate) => Promise<void>;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  mode,
  onSubmit,
}) => {
  const title =
    mode === 'create'
      ? 'Create Project'
      : mode === 'edit'
        ? 'Edit Project'
        : 'Project Details';

  const handleSubmit = async (data: ProjectCreate | ProjectUpdate) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <ModalBody>
        <ProjectForm
          project={project}
          mode={mode}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </ModalBody>
    </ThemedModal>
  );
};
