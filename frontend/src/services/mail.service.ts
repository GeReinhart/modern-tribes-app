import { apiService } from './api.service';
import { MailWithRecipients, MailsFilter } from '../types/mail.types';

class MailService {
    async getAll(filters: MailsFilter = {}): Promise<MailWithRecipients[]> {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.mail_status) params.set('mail_status', filters.mail_status);
        if (filters.user_email) params.set('user_email', filters.user_email);
        const qs = params.toString();
        return apiService.get<MailWithRecipients[]>(`/query/mails${qs ? `?${qs}` : ''}`);
    }
}

export const mailService = new MailService();
