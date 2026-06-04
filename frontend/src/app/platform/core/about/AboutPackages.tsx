import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { LocalizedText, useLocalizedText } from '@/app/platform/core/about/localized-text.ts';
import { MarkdownContent } from '@/app/platform/core/about/MarkdownContent.tsx';

import React from 'react';

export interface PackageDef {
  package: string;
  description: LocalizedText;
}

type Variant = 'primary' | 'secondary' | 'accent';

interface Props {
  title: string;
  packages: PackageDef[];
  variant?: Variant;
}

const PackageCard: React.FC<{ pkg: PackageDef; variant: Variant }> = ({ pkg, variant }) => {
  const localize = useLocalizedText();

  return (
    <ThemedCard variant={variant} bordered>
      <div style={{ marginBottom: '6px' }}>
        <ThemedBadge variant={variant}>{pkg.package}</ThemedBadge>
      </div>
      <MarkdownContent content={localize(pkg.description)} />
    </ThemedCard>
  );
};

export const AboutPackages: React.FC<Props> = ({ title, packages, variant = 'secondary' }) => {
  const { theme } = useTheme();

  return (
    <div style={{ marginBottom: '20px' }}>
      <ThemedText
        size="small"
        style={{
          fontWeight: 700,
          marginBottom: '8px',
          color: theme.colors.secondary,
          display: 'block',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {title}
      </ThemedText>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '8px',
        }}
      >
        {packages.map((pkg) => (
          <PackageCard key={pkg.package} pkg={pkg} variant={variant} />
        ))}
      </div>
    </div>
  );
};
