import BeatIndicator from '@/app/features/guitar/metronome/BeatIndicator.tsx';
import { useMetronome } from '@/app/features/guitar/metronome/useMetronome.ts';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
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
    <ThemedCard bordered className="flex flex-col items-center gap-1 p-2">
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={toggle}
          title={isRunning ? t('features.guitarMetronome.stop') : t('features.guitarMetronome.start')}
          style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            border: `1px solid ${theme.colors.primary}`,
            backgroundColor: isRunning ? theme.colors.primary : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {isRunning ? (
            <div style={{ width: '8px', height: '8px', backgroundColor: theme.colors.surface }} />
          ) : (
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderLeft: `8px solid ${theme.colors.primary}`,
                marginLeft: '2px',
              }}
            />
          )}
        </button>
        <button
          type="button"
          onClick={() => setAccentEnabled(!accentEnabled)}
          title={accentEnabled ? t('features.guitarMetronome.accentOn') : t('features.guitarMetronome.accentOff')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
        >
          <ThemedSvgIcon name="star" color={accentEnabled ? theme.colors.primary : theme.colors.secondary} size={16} />
        </button>
      </div>
      <BeatIndicator
        beatsPerBar={beatsPerBar}
        activeBeat={activeBeat}
        accentEnabled={accentEnabled}
        size={5}
        accentSize={8}
        gap={3}
      />
    </ThemedCard>
  );
};
