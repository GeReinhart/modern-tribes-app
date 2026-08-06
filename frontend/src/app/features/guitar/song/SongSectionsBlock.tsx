import { ChordDiagramSize, ChordDiagramStyle } from '@/app/features/guitar/chords/ChordDiagram.tsx';

import React from 'react';

import { SongSectionReadView } from './SongSectionReadView.tsx';
import { GuitarSongSection } from './types.ts';

interface SongSectionsBlockProps {
  sections: GuitarSongSection[];
  diagramStyle: ChordDiagramStyle;
  diagramSize: ChordDiagramSize;
}

export const SongSectionsBlock: React.FC<SongSectionsBlockProps> = ({ sections, diagramStyle, diagramSize }) => (
  <div>
    {sections.map((section) => (
      <SongSectionReadView key={section.id} section={section} diagramStyle={diagramStyle} diagramSize={diagramSize} />
    ))}
  </div>
);
