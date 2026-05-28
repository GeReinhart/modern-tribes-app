import { useApi } from '@/hooks/useApi';
import { mailService } from '@/services/mail.service';
import { MailWithRecipients, MailsFilter } from '@/types/mail.types';

import { useCallback, useEffect, useState } from 'react';

export function useMails(filters: MailsFilter = {}) {
  const [mails, setMails] = useState<MailWithRecipients[]>([]);
  const { loading, error, execute } = useApi<MailWithRecipients[]>();

  const filtersKey = JSON.stringify(filters);
  const refetch = useCallback(async () => {
    const data = await execute(() => mailService.getAll(filters));
    if (data) setMails(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, execute]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { mails, loading, error, refetch };
}
