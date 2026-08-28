import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface Props {
  children: React.ReactNode;
}

// Matches the label style ThemedInput/ThemedMultiSelect render internally, so every
// field label in the meal forms looks the same whether it comes from a themed
// component or a plain section heading (e.g. the description editor).
const FieldLabel: React.FC<Props> = ({ children }) => {
  const { theme } = useTheme();
  return (
    <span className="block text-sm font-medium mb-1" style={{ color: theme.colors.primary }}>
      {children}
    </span>
  );
};

export default FieldLabel;
