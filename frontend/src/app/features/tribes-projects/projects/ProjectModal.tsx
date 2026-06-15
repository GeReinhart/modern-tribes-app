import {
  ModalBody,
  ThemedModal,
} from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { FormMode } from '@/app/platform/core/common.types.ts';
import {
  Project,
  ProjectCreate,
  ProjectUpdate,
} from '@/app/features/tribes-projects/projects/project.types.ts';

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
