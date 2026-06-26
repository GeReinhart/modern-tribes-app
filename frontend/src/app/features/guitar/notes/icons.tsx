import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface SvgProps { size?: number; }

const Svg: React.FC<{ size: number; children: React.ReactNode }> = ({ size, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

// Clock face — automatic timer
export const AutoIcon: React.FC<SvgProps> = ({ size = 20 }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="9" />
    <polyline points="12,7 12,12 15,14" />
  </Svg>
);

// Mouse cursor arrow — manual control
export const ManualIcon: React.FC<SvgProps> = ({ size = 20 }) => (
  <Svg size={size}>
    <path d="M5 3l14 9-7 1-2 7z" fill="currentColor" stroke="none" />
  </Svg>
);

export const PlayIcon: React.FC<SvgProps> = ({ size = 18 }) => (
  <Svg size={size}><polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none" /></Svg>
);

export const PauseIcon: React.FC<SvgProps> = ({ size = 18 }) => (
  <Svg size={size}>
    <rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" />
    <rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" />
  </Svg>
);

export const NextIcon: React.FC<SvgProps> = ({ size = 18 }) => (
  <Svg size={size}>
    <polygon points="5,4 15,12 5,20" fill="currentColor" stroke="none" />
    <line x1="19" y1="4" x2="19" y2="20" strokeWidth="3" />
  </Svg>
);

export const EyeIcon: React.FC<SvgProps> = ({ size = 18 }) => (
  <Svg size={size}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const SoundIcon: React.FC<SvgProps> = ({ size = 18 }) => (
  <Svg size={size}>
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" stroke="none" />
    <path d="M15.54 8.46a5 5 0 010 7.07" />
    <path d="M19.07 4.93a10 10 0 010 14.14" />
  </Svg>
);

export const SoundOffIcon: React.FC<SvgProps> = ({ size = 18 }) => (
  <Svg size={size}>
    <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor" stroke="none" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </Svg>
);

export const RepeatIcon: React.FC<SvgProps> = ({ size = 18 }) => (
  <Svg size={size}>
    <polyline points="17,1 21,5 17,9" />
    <path d="M3 11V9a4 4 0 014-4h14" />
    <polyline points="7,23 3,19 7,15" />
    <path d="M21 13v2a4 4 0 01-4 4H3" />
  </Svg>
);

export const FretboardIcon: React.FC<SvgProps> = ({ size = 18 }) => (
  <Svg size={size}>
    <line x1="3" y1="7" x2="21" y2="7" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="17" x2="21" y2="17" />
    <line x1="9" y1="4" x2="9" y2="20" />
    <line x1="15" y1="4" x2="15" y2="20" />
    <circle cx="12" cy="9" r="2" fill="currentColor" stroke="none" />
  </Svg>
);

export const EyeOffIcon: React.FC<SvgProps> = ({ size = 18 }) => (
  <Svg size={size}>
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </Svg>
);

interface IconButtonProps {
  onClick: () => void;
  title: string;
  primary?: boolean;
  children: React.ReactNode;
}

export const IconButton: React.FC<IconButtonProps> = ({ onClick, title, primary, children }) => {
  const { theme } = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: `2px solid ${primary ? theme.colors.primary : theme.colors.ghost}`,
        backgroundColor: primary ? theme.colors.primary : 'transparent',
        color: primary ? theme.colors.surface : theme.colors.text,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
};
