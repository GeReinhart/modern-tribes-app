import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { ChordDiagram } from './ChordDiagram.tsx';
import { GuitarChord } from './types.ts';

interface ChordCardProps {
  chord: GuitarChord;
  onEdit: () => void;
  onDelete: () => void;
}

export const ChordCard: React.FC<ChordCardProps> = ({ chord, onEdit, onDelete }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <ThemedCard bordered className="flex flex-col gap-2 p-4">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px', color: theme.colors.text }}>{chord.name}</div>
          <div style={{ fontSize: '12px', color: theme.colors.secondary }}>
            {t('guitarChords.list.root')}: {chord.root_note}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <ThemedIconButton action={{ icon: 'pencil', label: t('common.edit'), onClick: onEdit }} />
          <ThemedIconButton
            action={{ icon: 'trash', label: t('common.delete'), onClick: onDelete, variant: 'danger' }}
          />
        </div>
      </div>
      <ChordDiagram frets={chord.frets} rootNote={chord.root_note} />
      {chord.description && (
        <div style={{ fontSize: '13px', color: theme.colors.text, opacity: 0.85 }}>{chord.description}</div>
      )}
    </ThemedCard>
  );
};
