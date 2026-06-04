import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

const ShareIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline', verticalAlign: 'middle' }}
  >
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

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
  title: React.ReactNode;
  desc: string;
}

const Step: React.FC<StepProps> = ({ number, title, desc }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
    <div style={stepCircle}>{number}</div>
    <div>
      <p style={{ margin: 0, fontWeight: '600', fontSize: '15px' }}>{title}</p>
      <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>{desc}</p>
    </div>
  </div>
);

interface InstallInstructionsIosProps {
  isInSafari: boolean;
}

export const InstallInstructionsIos: React.FC<InstallInstructionsIosProps> = ({ isInSafari }) => {
  const { t } = useTranslation();

  return (
    <div>
      <ThemedText size="medium" style={{ marginBottom: '20px' }}>
        {t('install.ios.title')}
      </ThemedText>

      {!isInSafari && (
        <div
          style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
          }}
        >
          <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#92400e' }}>
            {t('install.ios.safariRequired')}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#78350f' }}>
            {t('install.ios.safariRequiredDesc')}
          </p>
        </div>
      )}

      {isInSafari && (
        <>
          <Step
            number={1}
            title={
              <>
                {t('install.ios.step1')} <ShareIcon />
              </>
            }
            desc={t('install.ios.step1desc')}
          />
          <Step number={2} title={t('install.ios.step2')} desc={t('install.ios.step2desc')} />
          <Step number={3} title={t('install.ios.step3')} desc={t('install.ios.step3desc')} />
        </>
      )}
    </div>
  );
};
