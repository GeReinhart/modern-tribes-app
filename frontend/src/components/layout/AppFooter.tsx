import { ZoomControl } from '@/components/common/layout/ZoomControl';
import { useTheme } from '@/contexts/ThemeContext';

import React from 'react';

export const AppFooter: React.FC = () => {
  const { theme } = useTheme();

  const footerStyle: React.CSSProperties = {
    position: 'sticky',
    bottom: 0,
    zIndex: 10,
    padding: '4px 16px',
    backgroundColor: `${theme.colors.primary}18`,
    borderTop: `1px solid ${theme.colors.primary}40`,
    boxShadow: '0 -2px 8px rgba(0,0,0,0.10)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  };

  return (
    <footer style={footerStyle}>
      <ZoomControl />
    </footer>
  );
};
