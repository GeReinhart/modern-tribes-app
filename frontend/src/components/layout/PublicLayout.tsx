import { ApplicationLogo } from '@/platform/themes/icons/ApplicationLogo';
import { useTheme } from '@/platform/themes/ThemeContext.tsx';

import React from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { theme, currentThemeKey } = useTheme();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.colors.surface }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: 'var(--header-pad)',
          backgroundColor: theme.colors.surface,
          borderBottom: `2px solid ${theme.colors.border}`,
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div className="header-logo">
          <ApplicationLogo size="sm" themeId={currentThemeKey} />
        </div>
      </header>
      <main style={{ padding: 'var(--main-pad)' }}>{children}</main>
    </div>
  );
};
