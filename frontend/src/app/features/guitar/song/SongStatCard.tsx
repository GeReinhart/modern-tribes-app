import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';

interface SongStatCardProps {
  label: string;
  value: string | number;
}

export const SongStatCard: React.FC<SongStatCardProps> = ({ label, value }) => {
  const { theme } = useTheme();

  return (
    <ThemedCard bordered className="flex flex-col items-center gap-1 p-2">
      <div style={{ fontSize: '10px', color: theme.colors.secondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontSize: '18px', fontWeight: 700, color: theme.colors.text }}>{value}</div>
    </ThemedCard>
  );
};
