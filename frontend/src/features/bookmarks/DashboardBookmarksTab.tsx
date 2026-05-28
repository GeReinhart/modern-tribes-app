import { ThemedSection } from '@/platform/themes/components/ThemedSection';
import { ThemedText } from '@/platform/themes/components/ThemedText';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { BookmarkCard } from './BookmarkCard';
import { useBookmarks } from './BookmarksContext';
import { UserBookmark, UserBookmarkUpdate } from './types';

const DashboardBookmarksTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    bookmarks,
    toggleBookmark,
    reorderBookmarks,
    updateBookmark,
    isLoading,
  } = useBookmarks();

  const handleMove = async (index: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? index - 1 : index + 1;
    const reordered = [...bookmarks];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    await reorderBookmarks(reordered.map((b) => b.id));
  };

  const handleRemove = async (bookmark: UserBookmark) => {
    await toggleBookmark(bookmark.page_path, bookmark.page_title);
  };

  const handleUpdate = async (bookmarkId: string, data: UserBookmarkUpdate) => {
    await updateBookmark(bookmarkId, data);
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
            onMove={handleMove}
            onRemove={handleRemove}
            onNavigate={(path) => navigate(path)}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </ThemedSection>
  );
};

export default DashboardBookmarksTab;
