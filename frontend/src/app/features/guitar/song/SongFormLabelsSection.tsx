import { ManageLabelsPanel } from '@/app/platform/core/layout/themes/components/ManageLabelsPanel.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { GuitarSongLabel, GuitarSongLabelCreate, GuitarSongLabelUpdate } from './types.ts';

interface SongFormLabelsSectionProps {
  labels: GuitarSongLabel[];
  attachedLabelIds: string[];
  canManage: boolean;
  onToggle: (labelId: string) => Promise<void>;
  onCreate: (data: GuitarSongLabelCreate) => Promise<void>;
  onUpdate: (labelId: string, data: GuitarSongLabelUpdate) => Promise<void>;
  onDelete: (labelId: string) => Promise<void>;
  onReorder?: (orderedIds: string[]) => Promise<void>;
}

export const SongFormLabelsSection: React.FC<SongFormLabelsSectionProps> = ({
  labels, attachedLabelIds, canManage, onToggle, onCreate, onUpdate, onDelete, onReorder,
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <ThemedText size="medium" as="h3" style={{ marginBottom: '8px' }}>
        {t('guitarSong.form.labels')}
      </ThemedText>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: canManage ? '14px' : 0 }}>
        {labels.map((label) => {
          const attached = attachedLabelIds.includes(label.id);
          return (
            <button
              key={label.id}
              type="button"
              onClick={() => onToggle(label.id)}
              style={{
                padding: '3px 10px',
                borderRadius: '14px',
                fontSize: 'var(--font-xs)',
                fontWeight: attached ? 700 : 500,
                cursor: 'pointer',
                border: `1px solid ${label.color}`,
                backgroundColor: attached ? `${label.color}30` : 'transparent',
                color: label.color,
              }}
            >
              {label.name}
            </button>
          );
        })}
      </div>
      {canManage && (
        <ManageLabelsPanel
          labels={labels}
          onCreate={async (name, color) => { await onCreate({ name, color }); }}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onReorder={onReorder}
        />
      )}
    </div>
  );
};
