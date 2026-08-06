import React from 'react';

import { SongAddRowButton } from './SongAddRowButton.tsx';
import { SongLayoutRow } from './SongLayoutRow.tsx';
import { SongMetronomeControls } from './SongMetronomeControls.tsx';
import { usedBlockTypesExcludingRow } from './layoutBlockOptions.ts';
import { GuitarSongDetail } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';

interface SongDetailBodyProps {
  song: GuitarSongDetail;
  canEdit: boolean;
  isManager: boolean;
  hook: ReturnType<typeof useGuitarSong>;
  labelsHook: ReturnType<typeof useGuitarSongLabels>;
}

export const SongDetailBody: React.FC<SongDetailBodyProps> = ({ song, canEdit, isManager, hook, labelsHook }) => {
  const canManage = canEdit && isManager;
  const sortedRows = [...song.layout.rows].sort((a, b) => a.position - b.position);
  const hasTempoBlock = usedBlockTypesExcludingRow(song.layout.rows).has('tempo');

  return (
    <>
      {sortedRows.map((row, index) => (
        <SongLayoutRow
          key={row.id}
          row={row}
          song={song}
          labelsHook={labelsHook}
          canEdit={canEdit}
          canManage={canManage}
          hook={hook}
          isFirst={index === 0}
          isLast={index === sortedRows.length - 1}
        />
      ))}
      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SongAddRowButton rows={song.layout.rows} hook={hook} />
        </div>
      )}
      {hasTempoBlock && (
        // A playback tool, not printable page content -- floats outside the page itself rather
        // than occupying row/column space, and stays put on screen as the page scrolls.
        <div style={{ position: 'fixed', right: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
          <SongMetronomeControls tempoBpm={song.tempo_bpm} beatsPerBar={song.beats_per_bar} />
        </div>
      )}
    </>
  );
};
