import { themesById } from '@/app/platform/core/layout/themes/themes.ts';

import React from 'react';

type TShirtSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ApplicationLogoProps {
  themeId?: string;
  size?: TShirtSize;
}

const sizeMap: Record<TShirtSize, number> = {
  xs: 64,
  sm: 90,
  md: 256,
  lg: 384,
  xl: 512,
};
export const ApplicationLogo: React.FC<ApplicationLogoProps> = ({
  themeId = 'default',
  size = 'md',
}) => {
  const pixelSize = sizeMap[size];
  const theme = themesById[themeId];
  const color1 = theme.colors.primary;
  const color2 = theme.colors.secondary;
  const color3 = theme.colors.accent;

  return (
    <svg width={pixelSize} height={pixelSize} viewBox="0 0 256 256" fill="none">
      <defs>
        <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: color1, stopOpacity: 0.5 }} />
          <stop offset="50%" style={{ stopColor: color2, stopOpacity: 0.5 }} />
          <stop offset="100%" style={{ stopColor: color3, stopOpacity: 0.5 }} />
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="64" fill="none" />
      <circle
        cx="128"
        cy="128"
        r="115"
        fill="none"
        stroke="url(#borderGradient)"
        strokeWidth="12"
      />
      <line
        x1="70"
        y1="90"
        x2="128"
        y2="128"
        stroke={color1}
        strokeWidth="6"
        opacity="0.5"
      />
      <line
        x1="186"
        y1="90"
        x2="128"
        y2="128"
        stroke={color2}
        strokeWidth="6"
        opacity="0.5"
      />
      <line
        x1="70"
        y1="166"
        x2="128"
        y2="128"
        stroke={color3}
        strokeWidth="6"
        opacity="0.5"
      />
      <line
        x1="186"
        y1="166"
        x2="128"
        y2="128"
        stroke={color1}
        strokeWidth="6"
        opacity="0.5"
      />
      <line
        x1="70"
        y1="90"
        x2="186"
        y2="90"
        stroke={color2}
        strokeWidth="6"
        opacity="0.3"
      />
      <line
        x1="70"
        y1="166"
        x2="186"
        y2="166"
        stroke={color3}
        strokeWidth="6"
        opacity="0.3"
      />
      <circle cx="70" cy="90" r="22" fill={color1} />
      <circle cx="186" cy="90" r="22" fill={color2} />
      <circle cx="70" cy="166" r="22" fill={color3} />
      <circle cx="186" cy="166" r="22" fill={color1} />
      <circle cx="128" cy="128" r="28" fill={color3} />
    </svg>
  );
};
