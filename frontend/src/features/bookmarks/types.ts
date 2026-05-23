export interface UserBookmark {
    id: string;
    page_path: string;
    page_title: string;
    display_order: number;
}

export interface UserBookmarksResponse {
    bookmarks: UserBookmark[];
}
