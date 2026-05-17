import { useState, useEffect, useCallback } from 'react';
import { mailService } from '@/services/mail.service';
import { MailWithRecipients, MailsFilter } from '@/types/mail.types';
import { useApi } from '@/hooks/useApi';

export function useMails(filters: MailsFilter = {}) {
    const [mails, setMails] = useState<MailWithRecipients[]>([]);
    const { loading, error, execute } = useApi<MailWithRecipients[]>();

    const refetch = useCallback(async () => {
        const data = await execute(() => mailService.getAll(filters));
        if (data) setMails(data);
    }, [JSON.stringify(filters), execute]);

    useEffect(() => { refetch(); }, [refetch]);

    return { mails, loading, error, refetch };
}
