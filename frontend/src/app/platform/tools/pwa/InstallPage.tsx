import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ApplicationLogo } from '@/app/platform/core/layout/themes/icons/ApplicationLogo.tsx';
import { InstallInstructionsAndroid } from './InstallInstructionsAndroid.tsx';
import { InstallInstructionsIos } from './InstallInstructionsIos.tsx';
import { usePWAInstall } from './usePWAInstall.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
};

const DesktopMessage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div style={{ textAlign: 'center' }}>
      <ThemedText size="medium" style={{ marginBottom: '12px' }}>
        {t('install.desktop.title')}
      </ThemedText>
      <ThemedText variant="secondary" size="small">
        {t('install.desktop.desc')}
      </ThemedText>
      <div
        style={{
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          padding: '12px 16px',
          marginTop: '16px',
          wordBreak: 'break-all',
          fontSize: '13px',
          color: '#374151',
          fontFamily: 'monospace',
        }}
      >
        {window.location.origin}/install
      </div>
    </div>
  );
};

export const InstallPage: React.FC = () => {
  const { t } = useTranslation();
  const { isStandalone, isIOS, isInSafari, isAndroid, isAndroidInAppBrowser, canPrompt, install } = usePWAInstall();
  const apkUrl: string | null = (import.meta.env.VITE_APK_DOWNLOAD_URL as string | undefined) ?? null;

  if (isStandalone) {
    return <Navigate to="/app" replace />;
  }

  return (
    <ThemeProvider defaultTheme="default">
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8">
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <ApplicationLogo size="sm" />
            </div>
            <ThemedText as="h1" size="large" style={{ marginBottom: '8px' }}>
              {t('install.title')}
            </ThemedText>
            <ThemedText variant="secondary" size="small">
              {t('install.subtitle')}
            </ThemedText>
          </div>

          <div style={card}>
            {isIOS && <InstallInstructionsIos isInSafari={isInSafari} />}
            {isAndroid && (
              <InstallInstructionsAndroid
                canPrompt={canPrompt}
                install={install}
                apkUrl={apkUrl}
                isInAppBrowser={isAndroidInAppBrowser}
              />
            )}
            {!isIOS && !isAndroid && <DesktopMessage />}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};
