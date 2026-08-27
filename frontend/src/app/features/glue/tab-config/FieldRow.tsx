import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface FieldRowProps {
  label: string;
  children: React.ReactNode;
}

export const FieldRow: React.FC<FieldRowProps> = ({ label, children }) => {
  const { theme } = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-md)',
      }}
    >
      <span style={{ color: theme.colors.text, fontSize: 'var(--font-sm)', fontWeight: 600 }}>
        {label}
      </span>
      {children}
    </div>
  );
};
