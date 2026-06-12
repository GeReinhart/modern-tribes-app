import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

export const InvertedMarkStyle: React.FC = () => {
  const { theme } = useTheme();
  return (
    <style>{`
      mark {
        background-color: ${theme.colors.text};
        color: ${theme.colors.surface};
        border-radius: 2px;
        padding: 0 2px;
      }
    `}</style>
  );
};
