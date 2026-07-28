import { Theme } from '@/app/platform/core/layout/themes/themes.ts';

import React from 'react';

export const useAppLayoutStyles = (theme: Theme) => {
  const layoutStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: theme.colors.surface,
    display: 'flex',
    flexDirection: 'column',
  };

  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    padding: 'var(--main-pad)',
  };

  const contentStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '1420px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  return { layoutStyle, mainStyle, contentStyle };
};
