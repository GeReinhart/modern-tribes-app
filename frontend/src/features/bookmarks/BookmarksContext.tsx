import { useAuth } from '@/contexts/AuthContext';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { userBookmarksService } from './service';
import { UserBookmark, UserBookmarkUpdate } from './types';

interface BookmarksContextType {
  bookmarks: UserBookmark[];
  isBookmarked: (pagePath: string) => boolean;
  toggleBookmark: (
    pagePath: string,
    pageTitle: string,
    description?: string | null,
    colorText?: string | null,
    colorBackground?: string | null,
  ) => Promise<void>;
  updateBookmark: (
    bookmarkId: string,
    data: UserBookmarkUpdate,
  ) => Promise<void>;
  reorderBookmarks: (orderedIds: string[]) => Promise<void>;
  isLoading: boolean;
}

const BookmarksContext = createContext<BookmarksContextType | null>(null);

export const BookmarksProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();
  const [bookmarks, setBookmarks] = useState<UserBookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    userBookmarksService
      .getBookmarks()
      .then((res) => setBookmarks(res.bookmarks))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [isAuthenticated]);

  const isBookmarked = useCallback(
    (pagePath: string) => bookmarks.some((b) => b.page_path === pagePath),
    [bookmarks],
  );

  const toggleBookmark = useCallback(
    async (
      pagePath: string,
      pageTitle: string,
      description: string | null = null,
      colorText: string | null = null,
      colorBackground: string | null = null,
    ) => {
      const existing = bookmarks.find((b) => b.page_path === pagePath);
      if (existing) {
        await userBookmarksService.removeBookmark(existing.id);
        setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
      } else {
        const added = await userBookmarksService.addBookmark(
          pagePath,
          pageTitle,
          description,
          colorText,
          colorBackground,
        );
        setBookmarks((prev) => [...prev, added]);
      }
    },
    [bookmarks],
  );

  const updateBookmark = useCallback(
    async (bookmarkId: string, data: UserBookmarkUpdate) => {
      const updated = await userBookmarksService.updateBookmark(
        bookmarkId,
        data,
      );
      setBookmarks((prev) =>
        prev.map((b) => (b.id === bookmarkId ? updated : b)),
      );
    },
    [],
  );

  const reorderBookmarks = useCallback(async (orderedIds: string[]) => {
    const res = await userBookmarksService.reorderBookmarks(orderedIds);
    setBookmarks(res.bookmarks);
  }, []);

  return (
    <BookmarksContext.Provider
      value={{
        bookmarks,
        isBookmarked,
        toggleBookmark,
        updateBookmark,
        reorderBookmarks,
        isLoading,
      }}
    >
      {children}
    </BookmarksContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBookmarks = (): BookmarksContextType => {
  const ctx = useContext(BookmarksContext);
  if (!ctx)
    throw new Error('useBookmarks must be used within BookmarksProvider');
  return ctx;
};
