export type MailStatus = 'not_sent' | 'sent';

export interface Mail {
  id: string;
  subject: string;
  content_html: string;
  mail_type?: string | null;
  mail_status: MailStatus;
  planned_at: string;
  sent_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface MailWithRecipients extends Mail {
  recipient_emails: string[];
}

export interface MailsFilter {
  status?: string;
  mail_status?: string;
  user_id?: string;
}
