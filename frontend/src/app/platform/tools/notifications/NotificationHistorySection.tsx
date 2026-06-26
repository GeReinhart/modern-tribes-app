import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedTable } from '@/app/platform/core/layout/themes/components/ThemedTable.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { notificationService } from '@/app/platform/tools/notifications/notification.service.ts';
import {
  AdminNotificationItem,
  NotificationStatus,
} from '@/app/platform/tools/notifications/notification.types.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const STATUS_COLORS: Record<NotificationStatus, string> = {
  [NotificationStatus.planned]: '#f59e0b',
  [NotificationStatus.sent]: '#10b981',
  [NotificationStatus.failed]: '#ef4444',
};

interface Props {
  refreshKey: number;
}

export function NotificationHistorySection({ refreshKey }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.listForAdmin();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const columns = useMemo(
    () => [
      {
        key: 'target_user_email',
        header: t('admin.notifications.historyRecipient'),
        render: (item: AdminNotificationItem) => (
          <span style={{ color: theme.colors.primary }}>{item.target_user_email}</span>
        ),
      },
      {
        key: 'message',
        header: t('admin.notifications.historyMessage'),
        render: (item: AdminNotificationItem) => <span>{item.message}</span>,
      },
      {
        key: 'notification_status',
        header: t('admin.notifications.historyStatus'),
        render: (item: AdminNotificationItem) => (
          <span
            style={{
              color: STATUS_COLORS[item.notification_status],
              fontWeight: 500,
            }}
          >
            {t(`admin.notifications.status.${item.notification_status}`)}
          </span>
        ),
      },
      {
        key: 'created_at',
        header: t('admin.notifications.historyDate'),
        render: (item: AdminNotificationItem) => (
          <span>{new Date(item.created_at).toLocaleString()}</span>
        ),
      },
    ],
    [t, theme.colors.primary],
  );

  return (
    <div style={{ marginTop: '16px' }}>
    <ThemedCard>
      <ThemedText variant="primary" as="h3">
        {t('admin.notifications.history')}
      </ThemedText>
      {loading && <ThemedLoadingSpinner />}
      {!loading && items.length === 0 && (
        <ThemedText variant="ghost">{t('admin.notifications.historyEmpty')}</ThemedText>
      )}
      {!loading && items.length > 0 && (
        <ThemedTable data={items} columns={columns} getRowId={(item) => item.id} />
      )}
    </ThemedCard>
    </div>
  );
}
