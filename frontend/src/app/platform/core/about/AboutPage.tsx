import appConfig from '@/app/application.json';
import { GithubIcon } from '@/app/platform/core/layout/themes/icons/GithubIcon.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { AboutStack } from '@/app/platform/core/about/AboutStack.tsx';
import { AboutPackages } from '@/app/platform/core/about/AboutPackages.tsx';
import { AboutFeatures } from '@/app/platform/core/about/AboutFeatures.tsx';
import { useLocalizedText } from '@/app/platform/core/about/localized-text.ts';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const GITHUB_URL = 'https://github.com/GeReinhart/modern-tribes-app';

const AboutPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const localize = useLocalizedText();

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('about.title') },
    ],
    [t],
  );

  const githubLinkStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    textDecoration: 'none',
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    transition: 'border-color 0.15s',
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <ThemedSection themeId="main_1">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <div>
            <ThemedText size="large" as="h1" style={{ fontWeight: 800, marginBottom: '6px' }}>
              {appConfig.name}
            </ThemedText>
            <ThemedText variant="secondary" size="small">
              {t('about.subtitle')}
            </ThemedText>
          </div>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={githubLinkStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border;
            }}
          >
            <GithubIcon color={theme.colors.text} size={18} />
            {t('about.sourceCode')}
          </a>
        </div>

        <ul style={{ marginBottom: '28px', paddingLeft: '20px' }}>
          {localize(appConfig.description).map((desc, i) => (
            <li
              key={i}
              style={{ fontSize: 'var(--font-sm)', color: theme.colors.text, marginBottom: '4px' }}
            >
              {desc}
            </li>
          ))}
        </ul>

        <AboutStack
          backendStack={appConfig.backend.stack}
          frontendStack={appConfig.frontend.stack}
        />

        <div style={{ marginBottom: '28px' }}>
          <ThemedText
            size="medium"
            as="h2"
            style={{ fontWeight: 700, marginBottom: '12px', color: theme.colors.primary }}
          >
            {t('about.platform')}
          </ThemedText>
          <AboutPackages
            title={t('about.platformCore')}
            packages={appConfig.platform.core}
            variant="primary"
          />
          <AboutPackages
            title={t('about.platformFunctions')}
            packages={appConfig.platform.functions}
            variant="secondary"
          />
          <AboutPackages
            title={t('about.platformTools')}
            packages={appConfig.platform.tools}
            variant="accent"
          />
        </div>

        <div>
          <ThemedText
            size="medium"
            as="h2"
            style={{ fontWeight: 700, marginBottom: '12px', color: theme.colors.primary }}
          >
            {t('about.features')}
          </ThemedText>
          <AboutFeatures features={appConfig.features.features} />
        </div>
      </ThemedSection>
    </AppLayout>
  );
};

const AboutPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <AboutPageContent />
  </ThemeProvider>
);

export default AboutPage;
