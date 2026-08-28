import { ManageLabelsPanel, ManagedLabel } from '@/app/platform/core/layout/themes/components/ManageLabelsPanel.tsx';
import { ThemedModal, ThemedModalBody } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

export type { ManagedLabel };

interface ManageLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  labels: ManagedLabel[];
  title?: string;
  usageCounts?: Record<string, number>;
  onCreate: (name: string, color: string) => Promise<void>;
  onUpdate: (id: string, updates: { name?: string; color?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder?: (orderedIds: string[]) => Promise<void>;
}

export const ManageLabelsModal: React.FC<ManageLabelsModalProps> = ({
  isOpen, onClose, labels, title, usageCounts, onCreate, onUpdate, onDelete, onReorder,
}) => {
  const { t } = useTranslation();

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={title ?? t('labels.manage')} size="sm">
      <ThemedModalBody>
        <ManageLabelsPanel
          labels={labels}
          usageCounts={usageCounts}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onReorder={onReorder}
        />
      </ThemedModalBody>
    </ThemedModal>
  );
};
