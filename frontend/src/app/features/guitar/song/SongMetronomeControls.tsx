import BeatIndicator from '@/app/features/guitar/metronome/BeatIndicator.tsx';
import { useMetronome } from '@/app/features/guitar/metronome/useMetronome.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SongMetronomeControlsProps {
  tempoBpm: number;
  beatsPerBar: number;
}

const noop = () => {};

export const SongMetronomeControls: React.FC<SongMetronomeControlsProps> = ({ tempoBpm, beatsPerBar }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [accentEnabled, setAccentEnabled] = useState(true);
  const { isRunning, activeBeat, toggle } = useMetronome(tempoBpm, beatsPerBar, accentEnabled, noop);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '12px' }}>
      <BeatIndicator beatsPerBar={beatsPerBar} activeBeat={activeBeat} accentEnabled={accentEnabled} />
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={toggle}
          style={{
            padding: '8px 28px',
            borderRadius: '20px',
            border: `2px solid ${isRunning ? theme.colors.text : theme.colors.primary}`,
            backgroundColor: isRunning ? 'transparent' : theme.colors.primary,
            color: isRunning ? theme.colors.text : theme.colors.surface,
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {isRunning ? t('features.guitarMetronome.stop') : t('features.guitarMetronome.start')}
        </button>
        <button
          type="button"
          onClick={() => setAccentEnabled(!accentEnabled)}
          style={{
            padding: '4px 12px',
            borderRadius: '12px',
            border: `1px solid ${theme.colors.primary}`,
            backgroundColor: accentEnabled ? theme.colors.primary : 'transparent',
            color: accentEnabled ? theme.colors.surface : theme.colors.primary,
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          {accentEnabled ? t('features.guitarMetronome.accentOn') : t('features.guitarMetronome.accentOff')}
        </button>
      </div>
    </div>
  );
};
