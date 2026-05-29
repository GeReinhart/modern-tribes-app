import { apiHooks } from '@/platform/core/api/api-hooks.ts';
import { mailService } from '@/platform/tools/mail/mail.service.ts';
import { MailWithRecipients, MailsFilter } from '@/platform/tools/mail/mail.types.ts';

import { useCallback, useEffect, useState } from 'react';

export function useMails(filters: MailsFilter = {}) {
  const [mails, setMails] = useState<MailWithRecipients[]>([]);
  const { loading, error, execute } = apiHooks<MailWithRecipients[]>();

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
