import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface ColorSwatchPickerProps {
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  size?: number;
}

export const ColorSwatchPicker: React.FC<ColorSwatchPickerProps> = ({
  colors,
  value,
  onChange,
  size = 20,
}) => {
  const { theme } = useTheme();

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            background: c,
            border: value === c ? `2px solid ${theme.colors.text}` : '2px solid transparent',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
};

export default ColorSwatchPicker;
