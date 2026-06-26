import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React from 'react';
import { useTranslation } from 'react-i18next';

const MIN_BPM = 20;
const MAX_BPM = 300;

interface Props {
  bpm: number;
  onChange: (v: number) => void;
  onTap: () => void;
}

const BpmControl: React.FC<Props> = ({ bpm, onChange, onTap }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) onChange(Math.max(MIN_BPM, Math.min(MAX_BPM, v)));
  };

  const adjust = (delta: number) => {
    onChange(Math.max(MIN_BPM, Math.min(MAX_BPM, bpm + delta)));
  };

  const buttonStyle = (primary?: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    borderRadius: '6px',
    border: `1px solid ${theme.colors.primary}`,
    backgroundColor: primary ? theme.colors.primary : 'transparent',
    color: primary ? theme.colors.surface : theme.colors.primary,
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '32px',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button type="button" onClick={() => adjust(-5)} style={buttonStyle()}>-5</button>
        <button type="button" onClick={() => adjust(-1)} style={buttonStyle()}>-1</button>
        <input
          type="number"
          min={MIN_BPM}
          max={MAX_BPM}
          value={bpm}
          onChange={handleInput}
          style={{
            width: '56px',
            textAlign: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            border: `1px solid ${theme.colors.border ?? theme.colors.text}`,
            borderRadius: '6px',
            padding: '4px',
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
          }}
        />
        <button type="button" onClick={() => adjust(1)} style={buttonStyle()}>+1</button>
        <button type="button" onClick={() => adjust(5)} style={buttonStyle()}>+5</button>
      </div>
      <div style={{ color: theme.colors.text, fontSize: '11px', opacity: 0.6 }}>BPM</div>
      <button type="button" onClick={onTap} style={{ ...buttonStyle(true), padding: '6px 20px', fontSize: '13px' }}>
        {t('features.guitarMetronome.tap')}
      </button>
    </div>
  );
};

export default BpmControl;
