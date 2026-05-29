import { MailWithRecipients, MailsFilter } from '@/platform/tools/mail/mail.types.ts';
import { apiService } from '@/platform/core/api/api.service.ts';

class MailService {
  async getAll(filters: MailsFilter = {}): Promise<MailWithRecipients[]> {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.mail_status) params.set('mail_status', filters.mail_status);
    if (filters.user_id) params.set('user_id', filters.user_id);
    const qs = params.toString();
    return apiService.get<MailWithRecipients[]>(
      `/query/mails${qs ? `?${qs}` : ''}`,
    );
  }
}

export const mailService = new MailService();
