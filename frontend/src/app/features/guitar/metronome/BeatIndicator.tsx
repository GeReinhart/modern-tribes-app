import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React from 'react';

interface Props {
  beatsPerBar: number;
  activeBeat: number | null;
  accentEnabled: boolean;
}

const BeatIndicator: React.FC<Props> = ({ beatsPerBar, activeBeat, accentEnabled }) => {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      {Array.from({ length: beatsPerBar }, (_, i) => {
        const isActive = activeBeat === i;
        const isAccent = accentEnabled && i === 0;
        const size = isAccent ? '52px' : '28px';
        return (
          <div
            key={i}
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: isActive
                ? (isAccent ? theme.colors.primary : theme.colors.text)
                : 'transparent',
              border: `2px solid ${isAccent ? theme.colors.primary : theme.colors.text}`,
              transition: 'background-color 0.05s',
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
};

export default BeatIndicator;
