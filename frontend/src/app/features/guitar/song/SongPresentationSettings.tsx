import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { marginsDraftFromSettings, MarginsDraft, SongLayoutMarginsForm } from './SongLayoutMarginsForm.tsx';
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
  const [draft, setDraft] = useState<MarginsDraft>(() => marginsDraftFromSettings(song));
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(marginsDraftFromSettings(song)), [song.layout.settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await hook.updateLayoutSettings(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={t('guitarSong.layout.openMarginsMenu')} size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
        <SongLayoutMarginsForm value={draft} onChange={setDraft} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ThemedButton onClick={handleSave} isLoading={saving} fullWidth={false}>
            {t('guitarSong.layout.save')}
          </ThemedButton>
        </div>
      </div>
    </ThemedModal>
  );
};
