import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChevronDown, ChevronUp, Pencil, Archive, Pin, PinOff } from 'lucide-react';

import { BookmarkEditModal } from './BookmarkEditModal.tsx';
import {
  DEFAULT_BOOKMARK_COLOR,
  UserBookmark,
  UserBookmarkUpdate,
} from './types.ts';

interface BookmarkCardProps {
  bookmark: UserBookmark;
  index: number;
  total: number;
  configuring: boolean;
  isPinned?: boolean;
  canPin?: boolean;
  onMove: (index: number, dir: 'up' | 'down') => void;
  onRemove: (bookmark: UserBookmark) => void;
  onNavigate: (pagePath: string) => void;
  onUpdate: (bookmarkId: string, data: UserBookmarkUpdate) => Promise<void>;
  onTogglePin?: (bookmark: UserBookmark) => Promise<void>;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  index,
  total,
  configuring,
  isPinned = false,
  canPin = false,
  onMove,
  onRemove,
  onNavigate,
  onUpdate,
  onTogglePin,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);

  const bgColor =
    bookmark.color_background ?? DEFAULT_BOOKMARK_COLOR.background;
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
      <div
        style={{
          padding: 'var(--space-sm) var(--space-md)',
          backgroundColor: bgColor,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 'var(--space-sm)',
          maxWidth: '600px',
        }}
      >
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
              fontSize: 'var(--font-sm)',
              fontWeight: 700,
              display: 'block',
              width: '100%',
              wordBreak: 'break-word',
            }}
          >
            {bookmark.page_title}
          </button>
          {bookmark.description && (
            <p
              style={{
                margin: 'var(--space-xs) 0 0',
                color: textColor,
                fontSize: 'var(--font-xs)',
                opacity: 0.8,
                wordBreak: 'break-word',
              }}
            >
              {bookmark.description}
            </p>
          )}
        </div>

        {configuring && (
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-xs)',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
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
            {canPin && onTogglePin && (
              <button
                style={{
                  ...iconBtnStyle(),
                  color: isPinned ? theme.colors.primary : theme.colors.secondary,
                }}
                onClick={() => onTogglePin(bookmark)}
                title={isPinned ? t('dashboard.pinnedTab.unpin') : t('dashboard.pinnedTab.pin')}
              >
                {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
              </button>
            )}
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
              title={t('bookmarks.archive')}
            >
              <Archive size={16} />
            </button>
          </div>
        )}
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
