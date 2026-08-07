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
        <React.Fragment key={row.id}>
          <SongLayoutRow
            row={row}
            song={song}
            labelsHook={labelsHook}
            canEdit={canEdit}
            canManage={canManage}
            hook={hook}
            isFirst={index === 0}
            isLast={index === sortedRows.length - 1}
          />
          {canEdit && index < sortedRows.length - 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '-8px 0 8px' }}>
              <SongAddRowButton rows={song.layout.rows} hook={hook} insertBeforeRowId={sortedRows[index + 1].id} />
            </div>
          )}
        </React.Fragment>
      ))}
      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SongAddRowButton rows={song.layout.rows} hook={hook} />
        </div>
      )}
      {canManage && (
        // Dropdowns on the last rows/blocks open downward and get cut off if there's nothing to
        // scroll to below them -- this keeps them reachable in edit mode.
        <div style={{ height: '75vh' }} aria-hidden="true" />
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
