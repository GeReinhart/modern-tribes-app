import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React from 'react';

interface Props {
  beatsPerBar: number;
  activeBeat: number | null;
  accentEnabled: boolean;
  size?: number;
  accentSize?: number;
  gap?: number;
}

const BeatIndicator: React.FC<Props> = ({
  beatsPerBar,
  activeBeat,
  accentEnabled,
  size = 28,
  accentSize = 52,
  gap = 16,
}) => {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', gap: `${gap}px`, alignItems: 'center' }}>
      {Array.from({ length: beatsPerBar }, (_, i) => {
        const isActive = activeBeat === i;
        const isAccent = accentEnabled && i === 0;
        const dotSize = `${isAccent ? accentSize : size}px`;
        return (
          <div
            key={i}
            style={{
              width: dotSize,
              height: dotSize,
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
