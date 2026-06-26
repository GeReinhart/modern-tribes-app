import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React from 'react';
import { useTranslation } from 'react-i18next';

const OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10];

interface Props {
  value: number;
  onChange: (v: number) => void;
}

const BeatsPerBarControl: React.FC<Props> = ({ value, onChange }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{ color: theme.colors.text, fontSize: '11px', opacity: 0.6 }}>
        {t('features.guitarMetronome.beatsPerBar')}
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {OPTIONS.map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              border: `1px solid ${theme.colors.primary}`,
              backgroundColor: value === n ? theme.colors.primary : 'transparent',
              color: value === n ? theme.colors.surface : theme.colors.primary,
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BeatsPerBarControl;
