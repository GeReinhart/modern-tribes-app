import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface ThemedCheckboxProps {
  label: string;
  helperText?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

export const ThemedCheckbox: React.FC<ThemedCheckboxProps> = ({ label, helperText, checked, onChange, id }) => {
  const { theme } = useTheme();
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div>
      <label htmlFor={inputId} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: theme.colors.primary }}
        />
        <span className="text-sm font-medium" style={{ color: theme.colors.text }}>{label}</span>
      </label>
      {helperText && (
        <p className="mt-1 text-sm" style={{ color: theme.colors.secondary }}>{helperText}</p>
      )}
    </div>
  );
};
