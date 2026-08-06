import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { sectionsBlockOptionLabel } from './layoutBlockOptions.ts';
import { GuitarSongLayoutBlock } from './types.ts';

interface SongLyricsBlockSetupProps {
  // Every OTHER "Lyrics & Chords" block already configured (has content, isn't itself a link) --
  // the only ones this block could mirror. No chains, no self-links: the caller filters those out.
  linkableBlocks: GuitarSongLayoutBlock[];
  onStartLyrics: () => Promise<void>;
  onLink: (linkedToBlockId: string) => Promise<void>;
}

// Shown once for a "Lyrics & Chords" block with no content yet: either start typing a brand new
// part, or mirror an existing block's content -- the only two ways a block can get its content.
export const SongLyricsBlockSetup: React.FC<SongLyricsBlockSetupProps> = ({ linkableBlocks, onStartLyrics, onLink }) => {
  const { t } = useTranslation();
  const [linkedToBlockId, setLinkedToBlockId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      if (linkedToBlockId) {
        await onLink(linkedToBlockId);
      } else {
        await onStartLyrics();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      {linkableBlocks.length > 0 && (
        <div style={{ minWidth: '200px' }}>
          <ThemedSelect
            label={t('guitarSong.sections.linkToExisting')}
            options={linkableBlocks.map((block, index) => ({
              value: block.id, label: sectionsBlockOptionLabel(t, block, index),
            }))}
            value={linkedToBlockId}
            onChange={setLinkedToBlockId}
            placeholder={t('guitarSong.sections.linkToExistingNone')}
            allowEmpty
          />
        </div>
      )}
      <ThemedButton onClick={handleConfirm} isLoading={saving} fullWidth={false}>
        {t('guitarSong.sections.setupConfirm')}
      </ThemedButton>
    </div>
  );
};
