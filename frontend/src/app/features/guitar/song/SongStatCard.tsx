import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface SongStatCardProps {
  icon: IconName;
  label: string;
  value?: string | number;
  children?: React.ReactNode;
}

// Never draws its own card frame — the block it belongs to already offers a "show as card"
// toggle that wraps it when the user wants one, so drawing a frame here too would double it up.
export const SongStatCard: React.FC<SongStatCardProps> = ({ icon, label, value, children }) => {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col items-center gap-1">
      <ThemedSvgIcon name={icon} color={theme.colors.secondary} size={16} />
      {children || (
        <div style={{ fontSize: '18px', fontWeight: 700, color: theme.colors.text }} title={label}>
          {value}
        </div>
      )}
    </div>
  );
};
