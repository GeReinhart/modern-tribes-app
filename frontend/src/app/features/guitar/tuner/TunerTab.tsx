import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { centsFromTarget, findClosestString, GUITAR_STRINGS } from './guitarStrings.ts';
import StringSelector from './StringSelector.tsx';
import TunerDisplay from './TunerDisplay.tsx';
import TunerMeter from './TunerMeter.tsx';
import { GuitarTunerResult } from './tunerTypes.ts';
import { usePitchDetector } from './usePitchDetector.ts';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
}

const TunerTab: React.FC<Props> = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { micState, pitch: rawPitch, start, stop } = usePitchDetector();
  const [lockedString, setLockedString] = useState<number | null>(null);

  const pitch: GuitarTunerResult | null = useMemo(() => {
    if (!rawPitch) return null;
    if (lockedString === null) return rawPitch;
    const target = GUITAR_STRINGS.find(s => s.string === lockedString);
    if (!target) return rawPitch;
    return {
      ...rawPitch,
      targetNote: target.note,
      targetOctave: target.octave,
      targetLabel: target.label,
      targetString: target.string,
      cents: centsFromTarget(rawPitch.frequency, target),
    };
  }, [rawPitch, lockedString]);

  const detectedString = rawPitch ? findClosestString(rawPitch.frequency).string : null;
  const isActive = micState === 'active';
  const isRequesting = micState === 'requesting';

  const buttonLabel = isActive
    ? t('features.guitarTuner.stopMic')
    : isRequesting
    ? t('features.guitarTuner.requesting')
    : t('features.guitarTuner.startMic');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '32px 16px', backgroundColor: theme.colors.surface }}>
      <StringSelector
        activeString={lockedString}
        detectedString={detectedString}
        onSelect={setLockedString}
      />
      <TunerDisplay pitch={pitch} />
      <TunerMeter cents={pitch?.cents ?? null} />
      {micState === 'denied' && (
        <div style={{ color: theme.colors.text, fontSize: '14px', textAlign: 'center' }}>
          {t('features.guitarTuner.micDenied')}
        </div>
      )}
      <button
        type="button"
        onClick={isActive ? stop : start}
        disabled={isRequesting}
        style={{
          padding: '10px 28px',
          borderRadius: '24px',
          border: `2px solid ${isActive ? theme.colors.text : theme.colors.primary}`,
          backgroundColor: isActive ? 'transparent' : theme.colors.primary,
          color: isActive ? theme.colors.text : theme.colors.surface,
          fontSize: '16px',
          cursor: isRequesting ? 'default' : 'pointer',
          opacity: isRequesting ? 0.6 : 1,
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default TunerTab;
