import { StatusBadge } from '@/platform/themes/layout/StatusBadge.tsx';
import { ThemedBadge } from '@/platform/themes/layout/ThemedBadge.tsx';
import { ThemedDivider } from '@/platform/themes/layout/ThemedDivider.tsx';
import {
  ModalBody,
  ThemedModal,
} from '@/platform/themes/layout/ThemedModal.tsx';
import { ThemedText } from '@/platform/themes/layout/ThemedText.tsx';
import { useTheme } from '@/platform/themes/ThemeContext.tsx';
import { MailWithRecipients } from '@/platform/mail/mail.types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

interface MailDetailModalProps {
  mail: MailWithRecipients | null;
  onClose: () => void;
}

function MailStatusBadge({ mailStatus }: { mailStatus: string }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const color =
    mailStatus === 'sent' ? theme.colors.primary : theme.colors.secondary;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        color: 'white',
        backgroundColor: color,
      }}
    >
      {t(`mail_status.${mailStatus}`, { defaultValue: mailStatus })}
    </span>
  );
}

export const MailDetailModal: React.FC<MailDetailModalProps> = ({
  mail,
  onClose,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (!mail) return null;

  const row = (label: string, value: React.ReactNode) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <ThemedText variant="secondary" size="small">
        {label}
      </ThemedText>
      <div>{value}</div>
    </div>
  );

  return (
    <ThemedModal
      isOpen={!!mail}
      onClose={onClose}
      title={mail.subject}
      size="lg"
    >
      <ModalBody>
        <div className="space-y-3">
          {/* Meta */}
          {mail.mail_type &&
            row(
              t('admin.mails.mailType'),
              <ThemedBadge variant="secondary">{mail.mail_type}</ThemedBadge>,
            )}
          {row(t('monitoring.status'), <StatusBadge status={mail.status} />)}
          {row(
            t('admin.mails.mailStatus'),
            <MailStatusBadge mailStatus={mail.mail_status} />,
          )}
          {row(
            t('admin.mails.plannedAt'),
            <ThemedText variant="text" size="small">
              {new Date(mail.planned_at).toLocaleString()}
            </ThemedText>,
          )}
          {mail.sent_at &&
            row(
              t('admin.mails.sentAt'),
              <ThemedText variant="text" size="small">
                {new Date(mail.sent_at).toLocaleString()}
              </ThemedText>,
            )}
          {mail.created_by &&
            row(
              t('monitoring.createdBy'),
              <ThemedText variant="text" size="small">
                {mail.created_by}
              </ThemedText>,
            )}

          {/* Recipients */}
          <ThemedDivider variant="secondary" />
          <ThemedText variant="primary" size="small" as="h4">
            {t('admin.mails.recipients')}
          </ThemedText>
          {mail.recipient_emails.length === 0 ? (
            <ThemedText variant="secondary" size="small">
              {t('admin.mails.noRecipients')}
            </ThemedText>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {mail.recipient_emails.map((email) => (
                <ThemedBadge key={email} variant="accent">
                  {email}
                </ThemedBadge>
              ))}
            </div>
          )}

          {/* Content */}
          <ThemedDivider variant="secondary" />
          <ThemedText variant="primary" size="small" as="h4">
            {t('admin.mails.content')}
          </ThemedText>
          <div
            style={{
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: theme.colors.surface,
              maxHeight: '400px',
              overflowY: 'auto',
            }}
            dangerouslySetInnerHTML={{ __html: mail.content_html }}
          />
        </div>
      </ModalBody>
    </ThemedModal>
  );
};
