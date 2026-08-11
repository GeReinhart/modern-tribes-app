import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React from 'react';

import { STRING_LABELS } from './chordTheory.ts';
import { FRET_OPTIONS } from './fretOptions.ts';

interface FretSelectorsProps {
  frets: string[];
  onChange: (stringIndex: number, value: string) => void;
  allowEmpty?: boolean;
  emptyPlaceholder?: string;
}

export const FretSelectors: React.FC<FretSelectorsProps> = ({
  frets,
  onChange,
  allowEmpty = false,
  emptyPlaceholder,
}) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
    {STRING_LABELS.map((label, stringIndex) => (
      <ThemedSelect
        key={stringIndex}
        label={label}
        options={FRET_OPTIONS}
        value={frets[stringIndex]}
        allowEmpty={allowEmpty}
        placeholder={emptyPlaceholder}
        onChange={(value) => onChange(stringIndex, value)}
      />
    ))}
  </div>
);
