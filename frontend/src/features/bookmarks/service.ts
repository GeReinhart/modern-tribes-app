import { apiService } from '@/platform/core/api/api.service.ts';

import {
  UserBookmark,
  UserBookmarkUpdate,
  UserBookmarksResponse,
} from './types';

export const userBookmarksService = {
  getBookmarks: (): Promise<UserBookmarksResponse> =>
    apiService.get<UserBookmarksResponse>('/user-bookmarks'),

  addBookmark: (
    pagePath: string,
    pageTitle: string,
    description: string | null,
    colorText: string | null,
    colorBackground: string | null,
  ): Promise<UserBookmark> =>
    apiService.post<UserBookmark>('/user-bookmarks', {
      page_path: pagePath,
      page_title: pageTitle,
      description,
      color_text: colorText,
      color_background: colorBackground,
    }),

  updateBookmark: (
    bookmarkId: string,
    data: UserBookmarkUpdate,
  ): Promise<UserBookmark> =>
    apiService.put<UserBookmark>(`/user-bookmarks/${bookmarkId}`, {
      page_title: data.page_title,
      description: data.description,
      color_text: data.color_text,
      color_background: data.color_background,
    }),

  removeBookmark: (bookmarkId: string): Promise<void> =>
    apiService.delete<void>(`/user-bookmarks/${bookmarkId}`),

  reorderBookmarks: (orderedIds: string[]): Promise<UserBookmarksResponse> =>
    apiService.put<UserBookmarksResponse>('/user-bookmarks/order', {
      ordered_ids: orderedIds,
    }),
};
