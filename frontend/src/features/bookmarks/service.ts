import { apiService } from '@/services/api.service';
import { UserBookmark, UserBookmarksResponse } from './types';

export const userBookmarksService = {
    getBookmarks: (): Promise<UserBookmarksResponse> =>
        apiService.get<UserBookmarksResponse>('/user-bookmarks'),

    addBookmark: (pagePath: string, pageTitle: string): Promise<UserBookmark> =>
        apiService.post<UserBookmark>('/user-bookmarks', { page_path: pagePath, page_title: pageTitle }),

    removeBookmark: (bookmarkId: string): Promise<void> =>
        apiService.delete<void>(`/user-bookmarks/${bookmarkId}`),

    reorderBookmarks: (orderedIds: string[]): Promise<UserBookmarksResponse> =>
        apiService.put<UserBookmarksResponse>('/user-bookmarks/order', { ordered_ids: orderedIds }),
};
