import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { GuitarTunerResult } from './tunerTypes.ts';

interface Props {
  pitch: GuitarTunerResult | null;
}

const IN_TUNE_THRESHOLD = 5;

function tuningStatus(cents: number): 'flat' | 'sharp' | 'in-tune' {
  if (cents < -IN_TUNE_THRESHOLD) return 'flat';
  if (cents > IN_TUNE_THRESHOLD) return 'sharp';
  return 'in-tune';
}

const TunerDisplay: React.FC<Props> = ({ pitch }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const status = pitch ? tuningStatus(pitch.cents) : null;
  const noteColor = status === 'in-tune' ? theme.colors.primary : theme.colors.text;
  const statusColor = status === 'in-tune' ? theme.colors.primary : theme.colors.text;

  const statusLabel = status === 'flat'
    ? `▼ ${t('features.guitarTuner.flat')} (${Math.abs(pitch!.cents)}¢)`
    : status === 'sharp'
    ? `▲ ${t('features.guitarTuner.sharp')} (${Math.abs(pitch!.cents)}¢)`
    : status === 'in-tune'
    ? t('features.guitarTuner.inTune')
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ fontSize: '72px', fontWeight: 'bold', lineHeight: 1, color: noteColor, minWidth: '100px', textAlign: 'center' }}>
        {pitch ? pitch.targetNote : '—'}
      </div>
      <div style={{ fontSize: '15px', color: theme.colors.ghost }}>
        {pitch ? `${t('features.guitarTuner.string')} ${pitch.targetString} — ${pitch.targetLabel}` : ''}
      </div>
      <div style={{ fontSize: '20px', fontWeight: '600', color: statusColor, minHeight: '28px' }}>
        {statusLabel ?? ''}
      </div>
      {pitch && (
        <div style={{ fontSize: '12px', color: theme.colors.ghost }}>
          {Math.round(pitch.frequency)} Hz
        </div>
      )}
    </div>
  );
};

export default TunerDisplay;
