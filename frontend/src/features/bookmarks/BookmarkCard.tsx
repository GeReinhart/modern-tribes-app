import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronUp, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { UserBookmark, UserBookmarkUpdate, DEFAULT_BOOKMARK_COLOR } from './types';
import { BookmarkEditModal } from './BookmarkEditModal';

interface BookmarkCardProps {
    bookmark: UserBookmark;
    index: number;
    total: number;
    onMove: (index: number, dir: 'up' | 'down') => void;
    onRemove: (bookmark: UserBookmark) => void;
    onNavigate: (pagePath: string) => void;
    onUpdate: (bookmarkId: string, data: UserBookmarkUpdate) => Promise<void>;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
    bookmark, index, total, onMove, onRemove, onNavigate, onUpdate,
}) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [editing, setEditing] = useState(false);

    const bgColor = bookmark.color_background ?? DEFAULT_BOOKMARK_COLOR.background;
    const textColor = bookmark.color_text ?? DEFAULT_BOOKMARK_COLOR.text;

    const iconBtnStyle = (disabled?: boolean): React.CSSProperties => ({
        background: 'none',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? theme.colors.border : theme.colors.secondary,
        display: 'flex',
        alignItems: 'center',
        padding: '4px',
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
    });

    const handleSave = async (data: UserBookmarkUpdate) => {
        await onUpdate(bookmark.id, data);
    };

    return (
        <>
            <div style={{
                padding: '12px 16px',
                backgroundColor: bgColor,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '8px',
                maxWidth: '600px'
            }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <button
                        onClick={() => onNavigate(bookmark.page_path)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            textAlign: 'left',
                            color: textColor,
                            fontSize: '14px',
                            fontWeight: 700,
                            display: 'block',
                            width: '100%',
                            wordBreak: 'break-word',
                        }}
                    >
                        {bookmark.page_title}
                    </button>
                    {bookmark.description && (
                        <p style={{
                            margin: '4px 0 0',
                            color: textColor,
                            fontSize: '12px',
                            opacity: 0.8,
                            wordBreak: 'break-word',
                        }}>
                            {bookmark.description}
                        </p>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexShrink: 0 }}>
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
                        onClick={() => setEditing(true)}
                        title={t('bookmarks.edit.open')}
                    >
                        <Pencil size={16} />
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

            {editing && (
                <BookmarkEditModal
                    bookmark={bookmark}
                    onSave={handleSave}
                    onClose={() => setEditing(false)}
                />
            )}
        </>
    );
};
