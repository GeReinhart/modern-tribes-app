import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongLabelPicker } from './SongLabelPicker.tsx';
import { GuitarSongLabel, GuitarSongLabelCreate, GuitarSongLabelUpdate } from './types.ts';

interface SongFormLabelsSectionProps {
  labels: GuitarSongLabel[];
  attachedLabelIds: string[];
  canManage: boolean;
  onToggle: (labelId: string) => Promise<void>;
  onCreate: (data: GuitarSongLabelCreate) => Promise<void>;
  onUpdate: (labelId: string, data: GuitarSongLabelUpdate) => Promise<void>;
  onDelete: (labelId: string) => Promise<void>;
}

export const SongFormLabelsSection: React.FC<SongFormLabelsSectionProps> = ({
  labels, attachedLabelIds, canManage, onToggle, onCreate, onUpdate, onDelete,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <ThemedText size="medium" as="h3" style={{ marginBottom: '8px' }}>
        {t('guitarSong.form.labels')}
      </ThemedText>
      <SongLabelPicker
        labels={labels}
        attachedLabelIds={attachedLabelIds}
        canEdit
        canManage={canManage}
        onToggle={onToggle}
        onCreate={onCreate}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
};
