import { ModalBody, ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongForm } from './SongForm.tsx';
import { GuitarSong, GuitarSongCreate } from './types.ts';

interface SongFormModalProps {
  isOpen: boolean;
  song?: GuitarSong;
  onClose: () => void;
  onSubmit: (data: GuitarSongCreate) => Promise<void>;
}

export const SongFormModal: React.FC<SongFormModalProps> = ({ isOpen, song, onClose, onSubmit }) => {
  const { t } = useTranslation();

  const handleSubmit = async (data: GuitarSongCreate) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <ThemedModal
      isOpen={isOpen}
      onClose={onClose}
      title={song ? t('guitarSong.form.editTitle') : t('guitarSong.form.addTitle')}
      size="sm"
    >
      <ModalBody>
        <SongForm song={song} onSubmit={handleSubmit} onCancel={onClose} />
      </ModalBody>
    </ThemedModal>
  );
};
