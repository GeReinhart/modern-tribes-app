import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronUp, ChevronDown, ExternalLink, Trash2 } from 'lucide-react';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedSection } from '@/components/common/layout/ThemedSection';
import { useBookmarks } from './BookmarksContext';
import { UserBookmark } from './types';

const BookmarkRow: React.FC<{
    bookmark: UserBookmark;
    index: number;
    total: number;
    onMove: (index: number, dir: 'up' | 'down') => void;
    onRemove: (bookmark: UserBookmark) => void;
    onOpen: (pagePath: string) => void;
}> = ({ bookmark, index, total, onMove, onRemove, onOpen }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    const iconBtnStyle = (disabled?: boolean): React.CSSProperties => ({
        background: 'none',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? theme.colors.border : theme.colors.secondary,
        display: 'flex',
        alignItems: 'center',
        padding: '4px',
        opacity: disabled ? 0.4 : 1,
    });

    return (
        <div style={{
            padding: '12px 16px',
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <ThemedText variant="primary" size="small">{bookmark.page_title}</ThemedText>
                <ThemedText variant="secondary" size="small">{bookmark.page_path}</ThemedText>
            </div>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
                <button
                    style={iconBtnStyle(index === 0)}
                    onClick={() => onMove(index, 'up')}
                    disabled={index === 0}
                    title={t('bookmarks.moveUp')}
                >
                    <ChevronUp size={16} />
                </button>
                <button
                    style={iconBtnStyle(index === total - 1)}
                    onClick={() => onMove(index, 'down')}
                    disabled={index === total - 1}
                    title={t('bookmarks.moveDown')}
                >
                    <ChevronDown size={16} />
                </button>
                <button
                    style={iconBtnStyle()}
                    onClick={() => onOpen(bookmark.page_path)}
                    title={t('bookmarks.open')}
                >
                    <ExternalLink size={16} />
                </button>
                <button
                    style={{ ...iconBtnStyle(), color: theme.colors.danger }}
                    onClick={() => onRemove(bookmark)}
                    title={t('bookmarks.remove')}
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

const DashboardBookmarksTab: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { bookmarks, toggleBookmark, reorderBookmarks, isLoading } = useBookmarks();

    const handleMove = async (index: number, dir: 'up' | 'down') => {
        const target = dir === 'up' ? index - 1 : index + 1;
        const reordered = [...bookmarks];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
        await reorderBookmarks(reordered.map(b => b.id));
    };

    const handleRemove = async (bookmark: UserBookmark) => {
        await toggleBookmark(bookmark.page_path, bookmark.page_title);
    };

    if (isLoading) {
        return <ThemedText variant="secondary">{t('common.loading')}</ThemedText>;
    }

    if (bookmarks.length === 0) {
        return (
            <ThemedSection themeId="main_1">
                <ThemedText variant="secondary" size="small">{t('bookmarks.empty')}</ThemedText>
            </ThemedSection>
        );
    }

    return (
        <ThemedSection themeId="main_1">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bookmarks.map((bookmark, index) => (
                    <BookmarkRow
                        key={bookmark.id}
                        bookmark={bookmark}
                        index={index}
                        total={bookmarks.length}
                        onMove={handleMove}
                        onRemove={handleRemove}
                        onOpen={path => navigate(path)}
                    />
                ))}
            </div>
        </ThemedSection>
    );
};

export default DashboardBookmarksTab;
