import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedTable } from '@/app/platform/core/layout/themes/components/ThemedTable.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { RowActionsMenu } from '@/app/platform/core/layout/themes/components/RowActionsMenu.tsx';
import { useUserSearch } from '@/app/platform/functions/people/users/useUserSearch.ts';
import { UserSearchResult } from '@/app/platform/tools/notifications/notification.types.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SendNotificationModal } from './SendNotificationModal.tsx';

interface Props {
  onNotificationSent: (name: string) => void;
  onError: () => void;
}

export function NotificationSearchSection({ onNotificationSent, onError }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [modalUser, setModalUser] = useState<UserSearchResult | null>(null);

  const { results: users, loading } = useUserSearch(query);

  const columns = useMemo(
    () => [
      {
        key: 'full_name',
        header: t('admin.notifications.name'),
        render: (u: UserSearchResult) => (
          <span style={{ fontWeight: 500, color: theme.colors.primary }}>{u.full_name}</span>
        ),
      },
      {
        key: 'email',
        header: t('admin.notifications.email'),
        render: (u: UserSearchResult) => <span>{u.email}</span>,
      },
      {
        key: 'actions',
        header: '',
        render: (u: UserSearchResult) => (
          <RowActionsMenu
            actions={[
              {
                icon: 'bell',
                label: t('admin.notifications.sendAction'),
                onClick: () => setModalUser(u),
              },
            ]}
          />
        ),
      },
    ],
    [t, theme.colors.primary],
  );

  return (
    <>
      <ThemedCard>
        <ThemedInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('admin.notifications.searchPlaceholder')}
          style={{ marginBottom: '16px', width: '100%' }}
        />
        {loading && <ThemedLoadingSpinner />}
        {!loading && query.length > 0 && users.length === 0 && (
          <ThemedText variant="ghost">{t('admin.notifications.noResults')}</ThemedText>
        )}
        {!loading && users.length > 0 && (
          <ThemedTable data={users} columns={columns} getRowId={(u) => u.id} />
        )}
      </ThemedCard>
      <SendNotificationModal
        user={modalUser}
        onClose={() => setModalUser(null)}
        onSuccess={(name) => {
          setModalUser(null);
          onNotificationSent(name);
        }}
        onError={() => {
          setModalUser(null);
          onError();
        }}
      />
    </>
  );
}
