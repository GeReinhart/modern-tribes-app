import { ChordDiagram, ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';
import { GuitarChord } from '@/app/features/guitar/chords/types.ts';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ModalBody, ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SongChordBadgeProps {
  chord: GuitarChord;
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  fontSizePx?: number;
  onRemove?: () => Promise<void>;
}

export const SongChordBadge: React.FC<SongChordBadgeProps> = ({
  chord, diagramStyle, diagramSize, fontSizePx = 18, onRemove,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleConfirmRemove = async () => {
    if (!onRemove) return;
    setRemoving(true);
    try {
      await onRemove();
      setConfirmOpen(false);
      setOpen(false);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
          fontSize: `${fontSizePx}px`,
          fontWeight: 700,
          color: theme.colors.primary,
        }}
      >
        {chord.name}
      </button>
      <ThemedModal isOpen={open} onClose={() => setOpen(false)} title={chord.name} size="sm">
        <ModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <ChordDiagram
              frets={chord.frets}
              rootNote={chord.root_note}
              diagramStyle={diagramStyle}
              diagramSize={diagramSize}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <ThemedButton variant="ghost" fullWidth={false} onClick={() => setOpen(false)}>
                {t('common.close')}
              </ThemedButton>
              {onRemove && (
                <ThemedButton variant="danger" fullWidth={false} onClick={() => setConfirmOpen(true)}>
                  {t('guitarSong.detail.removeChord')}
                </ThemedButton>
              )}
            </div>
          </div>
        </ModalBody>
      </ThemedModal>
      {onRemove && (
        <ThemedConfirmDialog
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirmRemove}
          title={t('guitarSong.detail.removeChord')}
          message={t('guitarSong.detail.removeChordConfirm', { name: chord.name })}
          variant="danger"
          isLoading={removing}
        />
      )}
    </>
  );
};
