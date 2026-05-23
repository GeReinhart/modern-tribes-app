import React from 'react';
import { Bookmark } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useBookmarks } from './BookmarksContext';

interface BookmarkToggleProps {
    pagePath: string;
    pageTitle: string;
}

export const BookmarkToggle: React.FC<BookmarkToggleProps> = ({ pagePath, pageTitle }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const { isBookmarked, toggleBookmark } = useBookmarks();
    const bookmarked = isBookmarked(pagePath);

    const handleClick = () => {
        toggleBookmark(pagePath, pageTitle).catch(console.error);
    };

    return (
        <button
            onClick={handleClick}
            title={bookmarked ? t('bookmarks.remove') : t('bookmarks.add')}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: `2px solid ${bookmarked ? theme.colors.primary : theme.colors.border}`,
                backgroundColor: bookmarked ? `${theme.colors.primary}15` : 'transparent',
                cursor: 'pointer',
                color: bookmarked ? theme.colors.primary : theme.colors.text,
                flexShrink: 0,
            }}
        >
            <Bookmark size={18} fill={bookmarked ? theme.colors.primary : 'none'} />
        </button>
    );
};
