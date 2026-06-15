import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  backendStack: string[];
  frontendStack: string[];
}

const StackGroup: React.FC<{ label: string; items: string[]; color: string }> = ({
  label,
  items,
  color,
}) => {
  const { theme } = useTheme();

  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '10px',
    fontSize: 'var(--font-xs)',
    fontWeight: 600,
    backgroundColor: `${theme.colors.primary}18`,
    color: theme.colors.primary,
    border: `1px solid ${theme.colors.primary}30`,
  };

  return (
    <div style={{ flex: 1, minWidth: '200px' }}>
      <ThemedText
        size="small"
        style={{ fontWeight: 700, marginBottom: '8px', color, display: 'block' }}
      >
        {label}
      </ThemedText>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {items.map((item) => (
          <span key={item} style={tagStyle}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export const AboutStack: React.FC<Props> = ({ backendStack, frontendStack }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div style={{ marginBottom: '28px' }}>
      <ThemedText
        size="medium"
        as="h2"
        style={{ fontWeight: 700, marginBottom: '12px', color: theme.colors.primary }}
      >
        {t('about.stack')}
      </ThemedText>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <StackGroup
          label={t('about.backendStack')}
          items={backendStack}
          color={theme.colors.secondary}
        />
        <StackGroup
          label={t('about.frontendStack')}
          items={frontendStack}
          color={theme.colors.accent}
        />
      </div>
    </div>
  );
};
