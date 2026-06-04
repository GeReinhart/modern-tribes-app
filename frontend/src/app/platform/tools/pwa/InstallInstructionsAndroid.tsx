import { ThemedSubmitButton } from '@/app/platform/core/layout/themes/components/ThemedSubmitButton.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const stepCircle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  backgroundColor: '#4f46e5',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '14px',
  flexShrink: 0,
};

interface StepProps {
  number: number;
  title: string;
  desc: string;
}

const Step: React.FC<StepProps> = ({ number, title, desc }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
    <div style={stepCircle}>{number}</div>
    <div>
      <p style={{ margin: 0, fontWeight: '600', fontSize: '15px' }}>{title}</p>
      <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>{desc}</p>
    </div>
  </div>
);

const divider: React.CSSProperties = {
  borderTop: '1px solid #e5e7eb',
  margin: '20px 0',
};

interface InstallInstructionsAndroidProps {
  canPrompt: boolean;
  install: () => Promise<void>;
  apkUrl: string | null;
}

export const InstallInstructionsAndroid: React.FC<InstallInstructionsAndroidProps> = ({
  canPrompt,
  install,
  apkUrl,
}) => {
  const { t } = useTranslation();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div>
      <ThemedText size="medium" style={{ marginBottom: '20px' }}>
        {t('install.android.title')}
      </ThemedText>

      {canPrompt && (
        <ThemedSubmitButton
          variant="secondary"
          isLoading={isInstalling}
          loadingText={t('install.android.installing')}
          onClick={handleInstall}
          style={{ marginBottom: '20px' }}
        >
          {t('install.android.installButton')}
        </ThemedSubmitButton>
      )}

      <ThemedText variant="secondary" size="small" style={{ marginBottom: '12px' }}>
        {t('install.android.manualTitle')}
      </ThemedText>

      <Step
        number={1}
        title={t('install.android.manual1')}
        desc={t('install.android.manual1desc')}
      />
      <Step
        number={2}
        title={t('install.android.manual2')}
        desc={t('install.android.manual2desc')}
      />
      <Step
        number={3}
        title={t('install.android.manual3')}
        desc={t('install.android.manual3desc')}
      />

      {apkUrl && (
        <>
          <div style={divider} />
          <ThemedText size="small" style={{ marginBottom: '6px' }}>
            {t('install.android.apkTitle')}
          </ThemedText>
          <ThemedText variant="secondary" size="small" style={{ marginBottom: '12px' }}>
            {t('install.android.apkDesc')}
          </ThemedText>
          <a
            href={apkUrl}
            download
            style={{
              display: 'block',
              textAlign: 'center',
              backgroundColor: '#111827',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '15px',
              marginBottom: '10px',
            }}
          >
            {t('install.android.apkButton')}
          </a>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>
            {t('install.android.apkWarning')}
          </p>
        </>
      )}
    </div>
  );
};
