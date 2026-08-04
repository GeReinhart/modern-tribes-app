import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedErrorMessage } from '@/app/platform/core/layout/themes/components/ThemedErrorMessage.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ModalBody, ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AddChordToSongModal } from './AddChordToSongModal.tsx';
import { guitarSongsService } from './service.ts';
import { SongChordRow } from './SongChordRow.tsx';
import { SongFormModal } from './SongFormModal.tsx';
import { SongMetronomeControls } from './SongMetronomeControls.tsx';
import { GuitarSongUpdate } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongDetailModalProps {
  songId: string;
  onClose: () => void;
  onArchived: () => void;
}

export const SongDetailModal: React.FC<SongDetailModalProps> = ({ songId, onClose, onArchived }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { song, loading, error, reload, addChord, updateComment, moveChord, removeChord } = useGuitarSong(songId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const handleEdit = async (data: GuitarSongUpdate) => {
    await guitarSongsService.updateSong(songId, data);
    await reload();
  };

  const handleArchive = async () => {
    await guitarSongsService.archiveSong(songId);
    setArchiveConfirmOpen(false);
    onArchived();
  };

  if (loading) {
    return (
      <ThemedModal isOpen onClose={onClose} size="lg">
        <ModalBody><ThemedLoadingSpinner text={t('common.loading')} /></ModalBody>
      </ThemedModal>
    );
  }
  if (error || !song) {
    return (
      <ThemedModal isOpen onClose={onClose} size="lg">
        <ModalBody><ThemedErrorMessage message={t('guitarSong.detail.loadError')} onRetry={reload} /></ModalBody>
      </ThemedModal>
    );
  }

  const chordIds = song.chords.map((sc) => sc.chord.id);

  return (
    <ThemedModal isOpen onClose={onClose} title={song.title} size="lg">
      <ModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ color: theme.colors.secondary, fontSize: '13px' }}>{song.author}</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <ThemedIconButton action={{ icon: 'pencil', label: t('common.edit'), onClick: () => setEditOpen(true) }} />
              <ThemedIconButton
                action={{ icon: 'trash', label: t('guitarSong.detail.archive'), onClick: () => setArchiveConfirmOpen(true), variant: 'danger' }}
              />
            </div>
          </div>
          <SongMetronomeControls tempoBpm={song.tempo_bpm} beatsPerBar={song.beats_per_bar} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, color: theme.colors.text }}>{t('guitarSong.detail.chords')}</div>
            <ThemedIconButton action={{ icon: 'plus', label: t('guitarSong.detail.addChord'), onClick: () => setPickerOpen(true) }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {song.chords.map((songChord, index) => (
              <SongChordRow
                key={songChord.id}
                songChord={songChord}
                isFirst={index === 0}
                isLast={index === song.chords.length - 1}
                onMoveUp={() => moveChord(songChord.id, 'prev')}
                onMoveDown={() => moveChord(songChord.id, 'next')}
                onRemove={() => removeChord(songChord.id)}
                onCommentBlur={(comment) => updateComment(songChord.id, { comment: comment || null })}
              />
            ))}
          </div>
        </div>
      </ModalBody>
      <AddChordToSongModal
        isOpen={pickerOpen}
        existingChordIds={chordIds}
        onClose={() => setPickerOpen(false)}
        onPickChord={async (chordId) => { await addChord({ chord_id: chordId }); }}
      />
      <SongFormModal isOpen={editOpen} song={song} onClose={() => setEditOpen(false)} onSubmit={handleEdit} />
      <ThemedConfirmDialog
        isOpen={archiveConfirmOpen}
        onClose={() => setArchiveConfirmOpen(false)}
        onConfirm={handleArchive}
        title={t('guitarSong.detail.archiveTitle')}
        message={t('guitarSong.detail.archiveMessage', { title: song.title })}
        variant="danger"
      />
    </ThemedModal>
  );
};
