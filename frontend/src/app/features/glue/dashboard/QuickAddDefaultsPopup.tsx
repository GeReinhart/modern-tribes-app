import { ThemedModal, ThemedModalBody } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { useCurrentUserProfile } from '@/app/platform/functions/people/users/useCurrentUserProfile.ts';
import { useUserTribes } from '@/app/features/tribes-projects/tribes/useTribes.ts';

import { QuickAddTypeSection } from './QuickAddTypeSection.tsx';
import { quickAddDefaultsService } from './quickAddDefaults.service.ts';
import type { QuickAddType } from './quickAddDefaults.types.ts';
import { useAllFeatureInstances } from './useAllFeatureInstances.ts';
import { useQuickAddDefaults } from './useQuickAddDefaults.ts';

const TYPE_ROWS: { quickAddType: QuickAddType; featureTypes: string[]; labelKey: string }[] = [
  { quickAddType: 'task', featureTypes: ['kanban', 'todo_list'], labelKey: 'dashboard.quickAddDefaults.task' },
  { quickAddType: 'event', featureTypes: ['events'], labelKey: 'dashboard.quickAddDefaults.event' },
];

interface QuickAddDefaultsPopupProps {
  onClose: () => void;
}

export const QuickAddDefaultsPopup: React.FC<QuickAddDefaultsPopupProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { user } = useCurrentUserProfile();
  const userId = user?.id ?? '';
  const { tribes } = useUserTribes(userId);
  const { options } = useAllFeatureInstances();
  const { data, refetch } = useQuickAddDefaults();

  const handleSet = async (quickAddType: QuickAddType, instanceId: string | null) => {
    await quickAddDefaultsService.set(quickAddType, instanceId);
    await refetch();
  };

  return (
    <ThemedModal isOpen title={t('dashboard.quickAddDefaults.title')} onClose={onClose} size="sm">
      <ThemedModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {TYPE_ROWS.map(({ quickAddType, featureTypes, labelKey }) => {
            const configuredId = data?.[quickAddType].feature_instance_id ?? null;
            const currentOption = options.find((o) => o.instance.id === configuredId);
            const currentLabel = currentOption
              ? `${currentOption.tribe_name} — ${currentOption.project_name} — ${currentOption.instance.name}`
              : null;
            return (
              <QuickAddTypeSection
                key={quickAddType}
                title={t(labelKey)}
                userId={userId}
                tribes={tribes}
                featureTypes={featureTypes}
                currentInstanceId={configuredId}
                currentLabel={currentLabel}
                onSet={(instanceId) => handleSet(quickAddType, instanceId)}
              />
            );
          })}
        </div>
      </ThemedModalBody>
    </ThemedModal>
  );
};
