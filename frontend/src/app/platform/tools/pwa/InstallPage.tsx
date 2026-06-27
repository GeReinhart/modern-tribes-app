import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ApplicationLogo } from '@/app/platform/core/layout/themes/icons/ApplicationLogo.tsx';
import { InstallInstructionsAndroid } from './InstallInstructionsAndroid.tsx';
import { InstallInstructionsIos } from './InstallInstructionsIos.tsx';
import { usePWAInstall } from './usePWAInstall.ts';
import { useApkVersionCheck } from './useApkVersionCheck.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

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

const VersionBanner: React.FC<{ apkUrl: string }> = ({ apkUrl }) => {
  const { t } = useTranslation();
  const { latestVersionName, updateAvailable, isLoading } = useApkVersionCheck();

  if (isLoading || latestVersionName === null) return null;

  if (updateAvailable) {
    return (
      <div
        style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
        }}
      >
        <p style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '15px', color: '#92400e' }}>
          {t('install.version.updateAvailable', { version: latestVersionName })}
        </p>
        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#78350f' }}>
          {t('install.version.updateDesc')}
        </p>
        <a
          href={apkUrl}
          download
          style={{
            display: 'inline-block',
            backgroundColor: '#92400e',
            color: 'white',
            padding: '10px 18px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          {t('install.android.apkButton')}
        </a>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '16px',
        fontSize: '14px',
        color: '#166534',
      }}
    >
      {t('install.version.upToDate', { version: latestVersionName })}
    </div>
  );
};

export const InstallPage: React.FC = () => {
  const { t } = useTranslation();
  const { isStandalone, isIOS, isInSafari, isAndroid, isAndroidInAppBrowser, canPrompt, install } = usePWAInstall();
  const apkUrl: string = (import.meta.env.VITE_APK_DOWNLOAD_URL as string | undefined) ?? '/downloads/modern-tribes.apk';

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

          <VersionBanner apkUrl={apkUrl} />

          {isStandalone ? (
            <div style={card}>
              <div style={{ textAlign: 'center' }}>
                <Link
                  to="/app"
                  style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    fontSize: '14px',
                    color: '#4f46e5',
                    textDecoration: 'none',
                    fontWeight: '600',
                  }}
                >
                  ← {t('install.version.backToApp')}
                </Link>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </ThemeProvider>
  );
};
