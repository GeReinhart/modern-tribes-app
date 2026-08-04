import { ChordDiagram } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface SongChordPickerCardProps {
  chord: GuitarChord;
  alreadyInSong: boolean;
  onAdd: () => void;
}

export const SongChordPickerCard: React.FC<SongChordPickerCardProps> = ({ chord, alreadyInSong, onAdd }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <ThemedCard bordered className="flex items-center justify-between gap-2 p-3">
      <div>
        <div style={{ fontWeight: 700, color: theme.colors.text }}>{chord.name}</div>
        <ChordDiagram frets={chord.frets} rootNote={chord.root_note} />
      </div>
      <ThemedIconButton
        action={{
          icon: 'plus',
          label: t('guitarSong.picker.add'),
          onClick: onAdd,
          disabled: alreadyInSong,
        }}
      />
    </ThemedCard>
  );
};
