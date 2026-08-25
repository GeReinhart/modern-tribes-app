import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface ThemedCheckboxProps {
  label: string;
  helperText?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  size?: 'md' | 'lg';
}

export const ThemedCheckbox: React.FC<ThemedCheckboxProps> = ({
  label, helperText, checked, onChange, id, size = 'md',
}) => {
  const { theme } = useTheme();
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  const boxSize = size === 'lg' ? '24px' : '16px';

  return (
    <div>
      <label htmlFor={inputId} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: boxSize, height: boxSize, accentColor: theme.colors.primary, flexShrink: 0 }}
        />
        {size === 'lg' ? (
          <span style={{ fontSize: 'var(--font-lg)', fontWeight: 500, color: theme.colors.text }}>{label}</span>
        ) : (
          <span className="text-sm font-medium" style={{ color: theme.colors.text }}>{label}</span>
        )}
      </label>
      {helperText && (
        <p className="mt-1 text-sm" style={{ color: theme.colors.secondary }}>{helperText}</p>
      )}
    </div>
  );
};
