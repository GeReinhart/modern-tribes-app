import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';

import React from 'react';

import { SongSectionReadView } from './SongSectionReadView.tsx';
import { GuitarSongSection } from './types.ts';

interface SongSectionsBlockProps {
  sections: GuitarSongSection[];
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
  lineSpacingPx: number;
  textSizePx: number;
  chordSizePx: number;
}

export const SongSectionsBlock: React.FC<SongSectionsBlockProps> = ({
  sections, diagramStyle, diagramSize, lineSpacingPx, textSizePx, chordSizePx,
}) => (
  <div>
    {sections.map((section) => (
      <SongSectionReadView
        key={section.id}
        section={section}
        diagramStyle={diagramStyle}
        diagramSize={diagramSize}
        lineSpacingPx={lineSpacingPx}
        textSizePx={textSizePx}
        chordSizePx={chordSizePx}
      />
    ))}
  </div>
);
