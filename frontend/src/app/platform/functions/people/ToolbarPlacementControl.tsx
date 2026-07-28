import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useToolbarPlacement } from '@/app/platform/core/layout/ToolbarPlacementContext.tsx';
import { ToolbarPlacement } from '@/app/platform/core/layout/toolbar.types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

export const ToolbarPlacementControl: React.FC = () => {
  const { t } = useTranslation();
  const { toolbarPlacement, setToolbarPlacement } = useToolbarPlacement();

  const options = [
    { value: 'off', label: t('profile.toolbarPlacementOff') },
    { value: 'header', label: t('profile.toolbarPlacementHeader') },
    { value: 'footer', label: t('profile.toolbarPlacementFooter') },
  ];

  return (
    <ThemedCard variant="secondary" bordered>
      <ThemedText variant="primary" size="medium" as="h3">
        {t('profile.toolbarPlacement')}
      </ThemedText>
      <div className="mt-3">
        <ThemedText variant="secondary" size="small">
          {t('profile.toolbarPlacementLabel')}
        </ThemedText>
        <div className="mt-2">
          <ThemedSelect
            options={options}
            value={toolbarPlacement}
            allowEmpty={false}
            onChange={(value) => setToolbarPlacement(value as ToolbarPlacement)}
          />
        </div>
      </div>
    </ThemedCard>
  );
};
