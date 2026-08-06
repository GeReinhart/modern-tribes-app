import React from 'react';

import { SongLayoutColumn } from './SongLayoutColumn.tsx';
import { GuitarSongDetail, GuitarSongLabel, GuitarSongLayoutRow as LayoutRow } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongLayoutRowProps {
  row: LayoutRow;
  song: GuitarSongDetail;
  labels: GuitarSongLabel[];
  chordsEditable: boolean;
  chordsManageable: boolean;
  hook: ReturnType<typeof useGuitarSong>;
}

export const SongLayoutRow: React.FC<SongLayoutRowProps> = ({
  row, song, labels, chordsEditable, chordsManageable, hook,
}) => {
  const sortedColumns = [...row.columns].sort((a, b) => a.position - b.position);

  return (
    <div
      className={row.page_break_before ? 'song-layout-page-break' : undefined}
      style={{ display: 'flex', width: '100%', marginBottom: '16px' }}
    >
      {sortedColumns.map((column) => (
        <SongLayoutColumn
          key={column.id}
          column={column}
          song={song}
          labels={labels}
          chordsEditable={chordsEditable}
          chordsManageable={chordsManageable}
          hook={hook}
        />
      ))}
    </div>
  );
};
