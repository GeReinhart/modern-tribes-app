import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React from 'react';
import { useTranslation } from 'react-i18next';
import BeatsPerBarControl from './BeatsPerBarControl.tsx';
import BeatIndicator from './BeatIndicator.tsx';
import BpmControl from './BpmControl.tsx';
import { useMetronome } from './useMetronome.ts';
import { useMetronomeSettings } from './useMetronomeSettings.ts';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
}

const MetronomeTab: React.FC<Props> = ({ featureInstanceId }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { bpm, setBpm, beatsPerBar, setBeatsPerBar, accentEnabled, setAccentEnabled } = useMetronomeSettings(featureInstanceId);
  const { isRunning, activeBeat, toggle, tap } = useMetronome(bpm, beatsPerBar, accentEnabled, setBpm);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '24px 16px', backgroundColor: theme.colors.surface }}>
      <BeatIndicator beatsPerBar={beatsPerBar} activeBeat={activeBeat} accentEnabled={accentEnabled} />
      <button
        type="button"
        onClick={toggle}
        style={{
          padding: '12px 40px',
          borderRadius: '24px',
          border: `2px solid ${isRunning ? theme.colors.text : theme.colors.primary}`,
          backgroundColor: isRunning ? 'transparent' : theme.colors.primary,
          color: isRunning ? theme.colors.text : theme.colors.surface,
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        {isRunning ? t('features.guitarMetronome.stop') : t('features.guitarMetronome.start')}
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <BpmControl bpm={bpm} onChange={setBpm} onTap={tap} />
        <BeatsPerBarControl value={beatsPerBar} onChange={setBeatsPerBar} />
        <button
          type="button"
          onClick={() => setAccentEnabled(!accentEnabled)}
          style={{
            padding: '4px 14px',
            borderRadius: '12px',
            border: `1px solid ${theme.colors.primary}`,
            backgroundColor: accentEnabled ? theme.colors.primary : 'transparent',
            color: accentEnabled ? theme.colors.surface : theme.colors.primary,
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {accentEnabled ? t('features.guitarMetronome.accentOn') : t('features.guitarMetronome.accentOff')}
        </button>
      </div>
    </div>
  );
};

export default MetronomeTab;
