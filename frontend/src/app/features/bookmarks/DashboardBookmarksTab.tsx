import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';
import { usePinnedTabsContext } from '@/app/features/glue/dashboard/PinnedTabsContext.tsx';
import { isProjectFeaturePath } from '@/app/features/glue/dashboard/pinnedTabs.types.ts';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { BookmarkCard } from './BookmarkCard.tsx';
import { useBookmarks } from './BookmarksContext.tsx';
import { UserBookmark, UserBookmarkUpdate } from './types.ts';

const DashboardBookmarksTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bookmarks, toggleBookmark, reorderBookmarks, updateBookmark, isLoading } = useBookmarks();
  const { isPinned, getPinnedTabId, pin, unpin } = usePinnedTabsContext();
  const [configuring, setConfiguring] = useState(false);

  const tabActions = useMemo(
    () => [
      {
        icon: 'settings' as const,
        label: configuring ? t('bookmarks.configuring') : t('bookmarks.configure'),
        onClick: () => setConfiguring((v) => !v),
      },
    ],
    [configuring, t],
  );

  useRegisterTabActions(tabActions);

  const handleMove = async (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1;
    const reordered = [...bookmarks];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await reorderBookmarks(reordered.map((b) => b.id));
  };

  const handleRemove = async (bookmark: UserBookmark) => {
    await toggleBookmark(bookmark.page_path, bookmark.page_title);
  };

  const handleUpdate = async (bookmarkId: string, data: UserBookmarkUpdate) => {
    await updateBookmark(bookmarkId, data);
  };

  const handleTogglePin = async (bookmark: UserBookmark) => {
    if (isPinned(bookmark.id)) {
      const pinnedTabId = getPinnedTabId(bookmark.id);
      if (pinnedTabId) await unpin(pinnedTabId);
    } else {
      await pin(bookmark.id);
    }
  };

  if (isLoading) {
    return <ThemedText variant="secondary">{t('common.loading')}</ThemedText>;
  }

  if (bookmarks.length === 0) {
    return (
      <ThemedSection themeId="main_1">
        <ThemedText variant="secondary" size="small">
          {t('bookmarks.empty')}
        </ThemedText>
      </ThemedSection>
    );
  }

  return (
    <ThemedSection themeId="main_1">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {bookmarks.map((bookmark, index) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            index={index}
            total={bookmarks.length}
            configuring={configuring}
            isPinned={isPinned(bookmark.id)}
            canPin={isProjectFeaturePath(bookmark.page_path)}
            onMove={handleMove}
            onRemove={handleRemove}
            onNavigate={(path) => navigate(path)}
            onUpdate={handleUpdate}
            onTogglePin={handleTogglePin}
          />
        ))}
      </div>
    </ThemedSection>
  );
};

export default DashboardBookmarksTab;
