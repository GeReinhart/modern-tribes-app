import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';

interface DirectoryCardStat {
  label: string;
  value: number;
}

interface DirectoryCardProps {
  title: string;
  subtitle: string;
  stats: DirectoryCardStat[];
  onClick: () => void;
}

export const DirectoryCard: React.FC<DirectoryCardProps> = ({ title, subtitle, stats, onClick }) => (
  <ThemedCard variant="primary" bordered>
    <div onClick={onClick} style={{ cursor: 'pointer' }}>
      <ThemedText variant="primary" size="medium" as="h3">
        {title}
      </ThemedText>
      <ThemedText variant="secondary" size="small">
        {subtitle}
      </ThemedText>
      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {stats.map((stat) => (
          <ThemedBadge key={stat.label} variant="ghost">
            {stat.value} {stat.label}
          </ThemedBadge>
        ))}
      </div>
    </div>
  </ThemedCard>
);
