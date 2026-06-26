import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Octave } from './sampleCatalog.ts';

const ALL_OCTAVES: Octave[] = [1, 2, 3, 4, 5];

interface Props {
  enabled: Octave[];
  onChange: (v: Octave[]) => void;
}

const OctaveFilter: React.FC<Props> = ({ enabled, onChange }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const toggle = (oct: Octave) => {
    const next = enabled.includes(oct)
      ? enabled.filter(o => o !== oct)
      : [...enabled, oct];
    if (next.length > 0) onChange(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: theme.colors.text, fontSize: '12px' }}>
        {t('features.guitarNotes.octaves')}
      </span>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
        {ALL_OCTAVES.map(oct => {
          const active = enabled.includes(oct);
          return (
            <button
              key={oct}
              type="button"
              onClick={() => toggle(oct)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: `2px solid ${active ? theme.colors.primary : theme.colors.ghost}`,
                backgroundColor: active ? theme.colors.primary : 'transparent',
                color: active ? theme.colors.surface : theme.colors.text,
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {oct}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default OctaveFilter;
