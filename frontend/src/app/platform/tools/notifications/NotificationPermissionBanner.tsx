import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const DISMISSED_KEY = 'notification_denied_banner_dismissed';

function isDismissed(): boolean {
  return localStorage.getItem(DISMISSED_KEY) === 'true';
}

export function NotificationPermissionBanner(): React.ReactElement | null {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'denied' && !isDismissed()) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#92400e',
        color: '#fef3c7',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      <span style={{ flex: 1, fontSize: '14px', lineHeight: '1.5' }}>
        {t('notifications.deniedBanner.message')}
      </span>
      <button
        onClick={handleDismiss}
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          color: '#fef3c7',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          padding: '0',
        }}
      >
        {t('notifications.deniedBanner.dismiss')}
      </button>
    </div>
  );
}
