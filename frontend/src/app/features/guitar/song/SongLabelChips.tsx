import React from 'react';

import { GuitarSongLabel } from './types.ts';

interface SongLabelChipsProps {
  labels: GuitarSongLabel[];
  labelIds: string[];
}

export const SongLabelChips: React.FC<SongLabelChipsProps> = ({ labels, labelIds }) => {
  const attached = labels.filter((label) => labelIds.includes(label.id));
  if (attached.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {attached.map((label) => (
        <span
          key={label.id}
          style={{
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
            border: `1px solid ${label.color}`,
            color: label.color,
          }}
        >
          {label.name}
        </span>
      ))}
    </div>
  );
};
