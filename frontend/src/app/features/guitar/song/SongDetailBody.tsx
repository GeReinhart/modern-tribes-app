import React from 'react';

import { SongLayoutRow } from './SongLayoutRow.tsx';
import { GuitarSongDetail } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';

interface SongDetailBodyProps {
  song: GuitarSongDetail;
  writeMode: boolean;
  canEdit: boolean;
  isManager: boolean;
  hook: ReturnType<typeof useGuitarSong>;
  labelsHook: ReturnType<typeof useGuitarSongLabels>;
}

export const SongDetailBody: React.FC<SongDetailBodyProps> = ({ song, writeMode, canEdit, isManager, hook, labelsHook }) => {
  const chordsEditable = writeMode && canEdit;
  const chordsManageable = writeMode && isManager;
  const sortedRows = [...song.layout.rows].sort((a, b) => a.position - b.position);

  return (
    <>
      {sortedRows.map((row) => (
        <SongLayoutRow
          key={row.id}
          row={row}
          song={song}
          labels={labelsHook.labels}
          chordsEditable={chordsEditable}
          chordsManageable={chordsManageable}
          hook={hook}
        />
      ))}
    </>
  );
};
