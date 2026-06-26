import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SAMPLE_CATALOG } from './sampleCatalog.ts';

const TOTAL = SAMPLE_CATALOG.length;

interface Props {
  progress: number;
}

const SamplesLoader: React.FC<Props> = ({ progress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const pct = Math.round((progress / TOTAL) * 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        padding: '48px 24px',
        minHeight: '300px',
        backgroundColor: theme.colors.surface,
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          border: `6px solid ${theme.colors.ghost}`,
          borderTop: `6px solid ${theme.colors.primary}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ color: theme.colors.text, fontSize: '18px', fontWeight: 600, margin: 0 }}>
        {t('features.guitarNotes.loadingSamples')}
      </p>
      <p style={{ color: theme.colors.ghost, fontSize: '14px', margin: 0 }}>
        {progress} / {TOTAL}
      </p>
      <div
        style={{
          width: '200px',
          height: '6px',
          backgroundColor: theme.colors.ghost,
          borderRadius: '3px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: theme.colors.primary,
            borderRadius: '3px',
            transition: 'width 0.2s ease',
          }}
        />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SamplesLoader;
