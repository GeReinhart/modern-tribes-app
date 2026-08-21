import React from 'react';

import { iconPathsCore } from './iconPathsCore.tsx';
import { iconPathsExtra1 } from './iconPathsExtra1.tsx';
import { iconPathsExtra2 } from './iconPathsExtra2.tsx';
import { iconPathsExtra3 } from './iconPathsExtra3.tsx';
import { iconPathsGroceries } from './iconPathsGroceries.tsx';
import { IconName } from './iconTypes.ts';

export type { IconName } from './iconTypes.ts';
export { ICON_NAMES } from './iconTypes.ts';

const paths: Record<IconName, React.ReactNode> = {
  ...iconPathsCore,
  ...iconPathsExtra1,
  ...iconPathsExtra2,
  ...iconPathsExtra3,
  ...iconPathsGroceries,
} as Record<IconName, React.ReactNode>;

interface ThemedSvgIconProps {
  name: IconName;
  color: string;
  size?: number;
  filled?: boolean;
}

export const ThemedSvgIcon: React.FC<ThemedSvgIconProps> = ({
  name,
  color,
  size = 20,
  filled = false,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? color : 'none'}
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {paths[name]}
  </svg>
);
