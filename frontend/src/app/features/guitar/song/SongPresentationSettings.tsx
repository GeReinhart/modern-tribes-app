import { ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongLayoutMarginsForm } from './SongLayoutMarginsForm.tsx';
import { GuitarSongDetail } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongPresentationSettingsProps {
  song: GuitarSongDetail;
  hook: ReturnType<typeof useGuitarSong>;
  isOpen: boolean;
  onClose: () => void;
}

export const SongPresentationSettings: React.FC<SongPresentationSettingsProps> = ({ song, hook, isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={t('guitarSong.layout.openMarginsMenu')} size="md">
      <div style={{ padding: '16px' }}>
        <SongLayoutMarginsForm settings={song.layout.settings} onSave={hook.updateLayoutSettings} />
      </div>
    </ThemedModal>
  );
};
