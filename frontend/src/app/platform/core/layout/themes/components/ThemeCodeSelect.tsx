import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { predefinedThemes, themeKeys } from '@/app/platform/core/layout/themes/themes.ts';

import React from 'react';

interface ThemeCodeSelectProps {
  label?: string;
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export const ThemeCodeSelect: React.FC<ThemeCodeSelectProps> = ({
  label,
  value,
  onChange,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const selectedTheme = value ? predefinedThemes[value] : null;

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: `2px solid ${theme.colors.secondary}`,
    backgroundColor: disabled ? '#f3f4f6' : 'white',
    color: theme.colors.text,
    fontSize: 'var(--font-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: theme.colors.secondary }}
        >
          {label}
        </label>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          style={selectStyle}
        >
          <option value="">None (inherit)</option>
          {themeKeys.map((key) => (
            <option key={key} value={key}>
              {predefinedThemes[key].name}
            </option>
          ))}
        </select>
        {selectedTheme && (
          <div
            style={{
              display: 'flex',
              gap: '4px',
              flexShrink: 0,
            }}
          >
            {(['primary', 'secondary', 'accent'] as const).map((colorKey) => (
              <div
                key={colorKey}
                title={colorKey}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: selectedTheme.colors[colorKey],
                  border: '1px solid rgba(0,0,0,0.15)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
