import { useResponsiveContext } from '@/contexts/ResponsiveContext.tsx';
import { useTheme } from '@/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.0;

export const ZoomControl: React.FC = () => {
  const { zoom, updateZoom } = useResponsiveContext();
  const { theme } = useTheme();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-xs)',
    fontSize: 'var(--font-xs)',
    color: theme.colors.text,
    userSelect: 'none',
  };

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width: 'var(--space-lg)',
    height: 'var(--space-lg)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 'var(--radius-sm)',
    backgroundColor: theme.colors.surface,
    color: disabled ? theme.colors.ghost : theme.colors.text,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--font-sm)',
    lineHeight: 1,
    flexShrink: 0,
    opacity: disabled ? 0.4 : 1,
  });

  return (
    <div style={containerStyle}>
      <button
        style={btnStyle(zoom <= ZOOM_MIN)}
        onClick={() => updateZoom(zoom - ZOOM_STEP)}
        disabled={zoom <= ZOOM_MIN}
        title="Zoom out"
      >
        −
      </button>
      <span style={{ minWidth: '36px', textAlign: 'center' }}>
        {Math.round(zoom * 100)}%
      </span>
      <button
        style={btnStyle(zoom >= ZOOM_MAX)}
        onClick={() => updateZoom(zoom + ZOOM_STEP)}
        disabled={zoom >= ZOOM_MAX}
        title="Zoom in"
      >
        +
      </button>
    </div>
  );
};
