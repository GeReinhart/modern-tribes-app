import { ChordDiagram, ChordDiagramSize, ChordDiagramStyle, diagramPixelWidth } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GuitarSongChord } from './types.ts';

interface SongChordRowProps {
  songChord: GuitarSongChord;
  isFirst: boolean;
  isLast: boolean;
  canEdit: boolean;
  canManage: boolean;
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onCommentBlur: (comment: string) => void;
}

export const SongChordRow: React.FC<SongChordRowProps> = ({
  songChord,
  isFirst,
  isLast,
  canEdit,
  canManage,
  diagramStyle,
  diagramSize,
  onMoveUp,
  onMoveDown,
  onRemove,
  onCommentBlur,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [comment, setComment] = useState(songChord.comment ?? '');

  const handleBlur = () => {
    if (comment !== (songChord.comment ?? '')) onCommentBlur(comment);
  };

  const cardWidth = Math.max(130, diagramPixelWidth(diagramSize, diagramStyle));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: `${cardWidth}px` }}>
      {canManage && (
        <div style={{ display: 'flex', gap: '2px' }}>
          <ThemedIconButton
            action={{ icon: 'chevron-up', label: t('guitarSong.detail.moveUp'), onClick: onMoveUp, disabled: isFirst }}
          />
          <ThemedIconButton
            action={{ icon: 'chevron-down', label: t('guitarSong.detail.moveDown'), onClick: onMoveDown, disabled: isLast }}
          />
          <ThemedIconButton
            action={{ icon: 'trash', label: t('guitarSong.detail.removeChord'), onClick: onRemove, variant: 'danger' }}
          />
        </div>
      )}
      <div style={{ fontWeight: 700, color: theme.colors.text }}>{songChord.chord.name}</div>
      <ChordDiagram
        frets={songChord.chord.frets}
        rootNote={songChord.chord.root_note}
        diagramStyle={diagramStyle}
        diagramSize={diagramSize}
      />
      {canEdit ? (
        <ThemedInput
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={handleBlur}
          placeholder={t('guitarSong.detail.commentPlaceholder')}
        />
      ) : (
        songChord.comment && (
          <div style={{ color: theme.colors.text, fontSize: '13px', opacity: 0.85, fontStyle: 'italic', textAlign: 'center' }}>
            {songChord.comment}
          </div>
        )
      )}
    </div>
  );
};
