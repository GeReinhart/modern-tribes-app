import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import {
  LocalizedText,
  useLocalizedText,
} from '@/app/platform/core/about/localized-text.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface SubPackageDef {
  package: string;
  description: LocalizedText;
}

export interface FeatureDef {
  package: string;
  description: LocalizedText;
  sub_packages?: SubPackageDef[];
}

interface Props {
  features: FeatureDef[];
}

const SubPackageList: React.FC<{ subPackages: SubPackageDef[] }> = ({ subPackages }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const localize = useLocalizedText();

  return (
    <div
      style={{
        borderLeft: `2px solid ${theme.colors.border}`,
        paddingLeft: '14px',
        marginTop: '10px',
      }}
    >
      <ThemedText
        size="small"
        style={{
          fontWeight: 600,
          marginBottom: '6px',
          color: theme.colors.secondary,
          display: 'block',
        }}
      >
        {t('about.subPackages')}
      </ThemedText>
      {subPackages.map((sub) => (
        <div key={sub.package} style={{ marginBottom: '8px' }}>
          <ThemedBadge variant="secondary">{sub.package}</ThemedBadge>
          <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
            {localize(sub.description).map((desc, i) => (
              <li key={i} style={{ fontSize: 'var(--font-xs)', color: theme.colors.text }}>
                {desc}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const FeatureCard: React.FC<{ feature: FeatureDef }> = ({ feature }) => {
  const { theme } = useTheme();
  const localize = useLocalizedText();

  return (
    <ThemedCard variant="accent" bordered>
      <div style={{ marginBottom: '6px' }}>
        <ThemedBadge variant="accent">{feature.package}</ThemedBadge>
      </div>
      <ul style={{ margin: 0, paddingLeft: '16px' }}>
        {localize(feature.description).map((desc, i) => (
          <li
            key={i}
            style={{ fontSize: 'var(--font-xs)', color: theme.colors.text, marginBottom: '2px' }}
          >
            {desc}
          </li>
        ))}
      </ul>
      {feature.sub_packages && feature.sub_packages.length > 0 && (
        <SubPackageList subPackages={feature.sub_packages} />
      )}
    </ThemedCard>
  );
};

export const AboutFeatures: React.FC<Props> = ({ features }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '8px',
      }}
    >
      {features.map((feature) => (
        <FeatureCard key={feature.package} feature={feature} />
      ))}
    </div>
  );
};
