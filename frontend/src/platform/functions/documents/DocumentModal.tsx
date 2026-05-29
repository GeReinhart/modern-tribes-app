import { ThemedModal } from '@/platform/core/layout/themes/components/ThemedModal.tsx';
import { FormMode } from '@/types/common.types.ts';
import {
  Document,
  DocumentCreate,
  DocumentUpdate,
} from '@/types/document.types.ts';

import React from 'react';

import { DocumentForm } from './DocumentForm.tsx';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document?: Document;
  mode: FormMode;
  onSubmit: (data: DocumentCreate | DocumentUpdate) => Promise<void>;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  mode,
  onSubmit,
}) => {
  const title =
    mode === 'create'
      ? 'Create Document'
      : mode === 'edit'
        ? 'Edit Document'
        : 'Document Details';

  const handleSubmit = async (data: DocumentCreate | DocumentUpdate) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <DocumentForm
        document={document}
        mode={mode}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </ThemedModal>
  );
};
