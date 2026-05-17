import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { adminMainThemeId, AdminNavigation } from '@/components/layout/AdminNavigation';
import { useMails } from '@/hooks/useMails';
import { useUsers } from '@/hooks/useUsers';
import { MailWithRecipients } from '@/types/mail.types';
import { MailDetailModal } from '@/components/entities/mails/MailDetailModal';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedTable } from '@/components/common/layout/ThemedTable.tsx';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner.tsx';
import { ThemedSelect } from '@/components/common/form/ThemedSelect.tsx';
import { ThemedBadge } from '@/components/common/layout/ThemedBadge.tsx';
import { StatusBadge } from '@/components/common/layout/StatusBadge.tsx';

const STATUS_OPTIONS = ['pending', 'active', 'archived'];
const MAIL_STATUS_OPTIONS = ['not_sent', 'sent'];

const MailsPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [filterStatus, setFilterStatus] = useState('');
    const [filterMailStatus, setFilterMailStatus] = useState('');
    const [filterUserEmail, setFilterUserEmail] = useState('');
    const [selectedMail, setSelectedMail] = useState<MailWithRecipients | null>(null);

    const { users } = useUsers();
    const { mails, loading, error } = useMails({
        status: filterStatus || undefined,
        mail_status: filterMailStatus || undefined,
        user_email: filterUserEmail || undefined,
    });

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('common.admin'), path: '/admin' },
        { label: t('admin.mails.title') },
    ], [t]);

    const columns = useMemo(() => [
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
                <span style={{ fontWeight: 500, color: theme.colors.primary }}>{m.subject}</span>
            ),
        },
        {
            key: 'recipients',
            header: t('admin.mails.recipients'),
            render: (m: MailWithRecipients) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {m.recipient_emails.length === 0 ? (
                        <ThemedBadge variant="secondary">{t('admin.mails.noRecipients')}</ThemedBadge>
                    ) : (
                        m.recipient_emails.map(email => (
                            <ThemedBadge key={email} variant="accent">{email}</ThemedBadge>
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
                    {new Date(m.planned_at).toLocaleString()}
                </span>
            ),
        },
        {
            key: 'sent_at',
            header: t('admin.mails.sentAt'),
            render: (m: MailWithRecipients) => (
                <span style={{ fontSize: '13px', color: theme.colors.secondary }}>
                    {m.sent_at ? new Date(m.sent_at).toLocaleString() : '—'}
                </span>
            ),
        },
        {
            key: 'mail_status',
            header: t('admin.mails.mailStatus'),
            render: (m: MailWithRecipients) => (
                <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'white',
                    backgroundColor: m.mail_status === 'sent' ? theme.colors.primary : theme.colors.secondary,
                }}>
                    {m.mail_status}
                </span>
            ),
        },
        {
            key: 'status',
            header: t('monitoring.status'),
            render: (m: MailWithRecipients) => <StatusBadge status={m.status} />,
        },
    ], [t, theme.colors]);

    const headerActions = <AdminNavigation currentPage="mails" />;

    if (loading) return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
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
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                    <div style={{ minWidth: '160px' }}>
                        <ThemedSelect
                            label={t('monitoring.status')}
                            value={filterStatus}
                            onChange={setFilterStatus}
                            options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                            placeholder={t('monitoring.allStatuses')}
                        />
                    </div>
                    <div style={{ minWidth: '160px' }}>
                        <ThemedSelect
                            label={t('admin.mails.mailStatus')}
                            value={filterMailStatus}
                            onChange={setFilterMailStatus}
                            options={MAIL_STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                            placeholder={t('admin.mails.allMailStatuses')}
                        />
                    </div>
                    <div style={{ minWidth: '220px', flex: 1 }}>
                        <ThemedSelect
                            label={t('monitoring.filterByUser')}
                            value={filterUserEmail}
                            onChange={setFilterUserEmail}
                            options={users.map(u => ({ value: u.email, label: u.email }))}
                            placeholder={t('monitoring.allUsers')}
                        />
                    </div>
                </div>
            </ThemedCard>

            {/* Table */}
            <ThemedCard>
                {mails.length === 0 ? (
                    <ThemedText size="small" variant="secondary">{t('admin.mails.noMails')}</ThemedText>
                ) : (
                    <ThemedTable
                        data={mails}
                        columns={columns}
                        getRowId={m => m.id}
                        onRowClick={m => setSelectedMail(m)}
                    />
                )}
            </ThemedCard>

            <MailDetailModal mail={selectedMail} onClose={() => setSelectedMail(null)} />
        </AppLayout>
    );
};

export const MailsPage: React.FC = () => (
    <ThemeProvider defaultTheme={adminMainThemeId}><MailsPageContent /></ThemeProvider>
);
