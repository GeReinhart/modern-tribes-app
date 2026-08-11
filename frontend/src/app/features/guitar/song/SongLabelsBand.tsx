import { ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongFormLabelsSection } from './SongFormLabelsSection.tsx';
import { SongLabelChips } from './SongLabelChips.tsx';
import { GuitarSongDetail } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';

interface SongLabelsBandProps {
  song: GuitarSongDetail;
  hook: ReturnType<typeof useGuitarSong>;
  labelsHook: ReturnType<typeof useGuitarSongLabels>;
  canManage: boolean;
  isManageOpen: boolean;
  onCloseManage: () => void;
}

// Labels are metadata about the song, not layout content -- shown above the page (both the edit
// and presentation screens) rather than as a placeable block. The manage action itself lives in
// the page's own action menu (not here), so it stays reachable even on a completed song (which
// offers no other editing surface) -- this component only displays the chips and the modal.
export const SongLabelsBand: React.FC<SongLabelsBandProps> = ({
  song, hook, labelsHook, canManage, isManageOpen, onCloseManage,
}) => {
  const { t } = useTranslation();
  const hasLabels = song.label_ids.length > 0;

  return (
    <>
      {hasLabels && <SongLabelChips labels={labelsHook.labels} labelIds={song.label_ids} />}
      <ThemedModal isOpen={isManageOpen} onClose={onCloseManage} title={t('guitarSong.labels.manageLabels')} size="md">
        <div style={{ padding: '16px' }}>
          <SongFormLabelsSection
            labels={labelsHook.labels}
            attachedLabelIds={song.label_ids}
            canManage={canManage}
            onToggle={(labelId) => hook.toggleLabel(labelId, song.label_ids.includes(labelId))}
            onCreate={labelsHook.createLabel}
            onUpdate={labelsHook.updateLabel}
            onDelete={labelsHook.deleteLabel}
            onReorder={labelsHook.reorderLabels}
          />
        </div>
      </ThemedModal>
    </>
  );
};
