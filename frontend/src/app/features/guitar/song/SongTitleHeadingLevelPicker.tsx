import React from 'react';

import { SongIconChoiceButton } from './SongIconChoiceButton.tsx';
import { ALL_TITLE_HEADING_LEVELS } from './layoutBlockOptions.ts';
import { TitleHeadingLevel } from './types.ts';

interface SongTitleHeadingLevelPickerProps {
  value: TitleHeadingLevel;
  ariaLabelPrefix: string;
  onChange: (level: TitleHeadingLevel) => void;
}

// Every button renders its icon at the same fixed size -- scaling the icon itself per level
// read as inconsistent rather than as a deliberate ramp; the H1/H2/H3/H4 caption is what
// actually conveys which size each option is.
export const SongTitleHeadingLevelPicker: React.FC<SongTitleHeadingLevelPickerProps> = ({
  value, ariaLabelPrefix, onChange,
}) => (
  <div style={{ display: 'flex', gap: '4px' }}>
    {ALL_TITLE_HEADING_LEVELS.map((level) => (
      <SongIconChoiceButton
        key={level}
        icon="hash"
        caption={level.toUpperCase()}
        ariaLabel={`${ariaLabelPrefix} ${level.toUpperCase()}`}
        selected={value === level}
        onClick={() => onChange(level)}
      />
    ))}
  </div>
);
