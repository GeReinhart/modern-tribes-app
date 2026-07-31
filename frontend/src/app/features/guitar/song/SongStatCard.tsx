import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface SongStatCardProps {
  icon: IconName;
  label: string;
  value: string | number;
}

export const SongStatCard: React.FC<SongStatCardProps> = ({ icon, label, value }) => {
  const { theme } = useTheme();

  return (
    <ThemedCard bordered className="flex flex-col items-center gap-1 p-2">
      <ThemedSvgIcon name={icon} color={theme.colors.secondary} size={16} />
      <div style={{ fontSize: '18px', fontWeight: 700, color: theme.colors.text }} title={label}>
        {value}
      </div>
    </ThemedCard>
  );
};
