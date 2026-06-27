import { formatDateTime } from '@/app/platform/core/dateFormat.ts';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { StatusBadge } from '@/app/platform/core/layout/themes/components/StatusBadge.tsx';
import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedTable } from '@/app/platform/core/layout/themes/components/ThemedTable.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { MailDetailModal } from '@/app/platform/tools/mail/MailDetailModal.tsx';
import {
  AdminNavigation,
  adminMainThemeId,
} from '@/app/platform/core/layout/AdminNavigation.tsx';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider, useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useMails } from '@/app/platform/tools/mail/useMails.ts';
import { useUsers } from '@/app/platform/functions/people/users/useUsers.ts';
import { MailWithRecipients } from '@/app/platform/tools/mail/mail.types.ts';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const STATUS_OPTIONS = ['pending', 'active', 'archived'];
const MAIL_STATUS_OPTIONS = ['not_sent', 'sent'];

const MailsPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMailStatus, setFilterMailStatus] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [selectedMail, setSelectedMail] = useState<MailWithRecipients | null>(
    null,
  );

  const { users } = useUsers();
  const { mails, loading, error } = useMails({
    status: filterStatus || undefined,
    mail_status: filterMailStatus || undefined,
    user_id: filterUserId || undefined,
  });

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('common.admin'), path: '/admin' },
      { label: t('admin.mails.title') },
    ],
    [t],
  );

  const columns = useMemo(
    () => [
      {
        key: 'mail_type',
        header: t('admin.mails.mailType'),
        render: (m: MailWithRecipients) => (
          <ThemedBadge variant="secondary">{m.mail_type ?? '—'}</ThemedBadge>
        ),
      },
      {
        key: 'subject',
        header: t('admin.mails.subject'),
        render: (m: MailWithRecipients) => (
          <span style={{ fontWeight: 500, color: theme.colors.primary }}>
            {m.subject}
          </span>
        ),
      },
      {
        key: 'recipients',
        header: t('admin.mails.recipients'),
        render: (m: MailWithRecipients) => (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {m.recipient_emails.length === 0 ? (
              <ThemedBadge variant="secondary">
                {t('admin.mails.noRecipients')}
              </ThemedBadge>
            ) : (
              m.recipient_emails.map((email) => (
                <ThemedBadge key={email} variant="accent">
                  {email}
                </ThemedBadge>
              ))
            )}
          </div>
        ),
      },
      {
        key: 'planned_at',
        header: t('admin.mails.plannedAt'),
        render: (m: MailWithRecipients) => (
          <span style={{ fontSize: '13px', color: theme.colors.secondary }}>
            {formatDateTime(m.planned_at)}
          </span>
        ),
      },
      {
        key: 'sent_at',
        header: t('admin.mails.sentAt'),
        render: (m: MailWithRecipients) => (
          <span style={{ fontSize: '13px', color: theme.colors.secondary }}>
            {m.sent_at ? formatDateTime(m.sent_at) : '—'}
          </span>
        ),
      },
      {
        key: 'mail_status',
        header: t('admin.mails.mailStatus'),
        render: (m: MailWithRecipients) => (
          <span
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'white',
              backgroundColor:
                m.mail_status === 'sent'
                  ? theme.colors.primary
                  : theme.colors.secondary,
            }}
          >
            {t(`mail_status.${m.mail_status}`, { defaultValue: m.mail_status })}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('monitoring.status'),
        render: (m: MailWithRecipients) => <StatusBadge status={m.status} />,
      },
    ],
    [t, theme.colors],
  );

  const headerActions = <AdminNavigation currentPage="mails" />;

  if (loading)
    return (
      <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
        <div
          style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}
        >
          <ThemedLoadingSpinner size="sm" />
        </div>
      </AppLayout>
    );

  return (
    <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
      <ThemedCard>
        <ThemedText size="small">{t('admin.mails.subtitle')}</ThemedText>
      </ThemedCard>

      {error && (
        <ThemedCard variant="danger">
          <ThemedText variant="danger">{error}</ThemedText>
        </ThemedCard>
      )}

      {/* Filters */}
      <ThemedCard>
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}
        >
          <div style={{ minWidth: '160px' }}>
            <ThemedSelect
              label={t('monitoring.status')}
              value={filterStatus}
              onChange={setFilterStatus}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
              placeholder={t('monitoring.allStatuses')}
            />
          </div>
          <div style={{ minWidth: '160px' }}>
            <ThemedSelect
              label={t('admin.mails.mailStatus')}
              value={filterMailStatus}
              onChange={setFilterMailStatus}
              options={MAIL_STATUS_OPTIONS.map((s) => ({
                value: s,
                label: t(`mail_status.${s}`, { defaultValue: s }),
              }))}
              placeholder={t('admin.mails.allMailStatuses')}
            />
          </div>
          <div style={{ minWidth: '220px', flex: 1 }}>
            <ThemedSelect
              label={t('monitoring.filterByUser')}
              value={filterUserId}
              onChange={setFilterUserId}
              options={users.map((u) => ({ value: u.id, label: u.email }))}
              placeholder={t('monitoring.allUsers')}
            />
          </div>
        </div>
      </ThemedCard>

      {/* Table */}
      <ThemedCard>
        {mails.length === 0 ? (
          <ThemedText size="small" variant="secondary">
            {t('admin.mails.noMails')}
          </ThemedText>
        ) : (
          <ThemedTable
            data={mails}
            columns={columns}
            getRowId={(m) => m.id}
            onRowClick={(m) => setSelectedMail(m)}
          />
        )}
      </ThemedCard>

      <MailDetailModal
        mail={selectedMail}
        onClose={() => setSelectedMail(null)}
      />
    </AppLayout>
  );
};

export const AdminMailsPage: React.FC = () => (
  <ThemeProvider defaultTheme={adminMainThemeId}>
    <MailsPageContent />
  </ThemeProvider>
);
