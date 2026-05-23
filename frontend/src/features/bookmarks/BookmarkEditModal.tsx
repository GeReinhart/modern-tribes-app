import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { UserBookmark, UserBookmarkUpdate, BOOKMARK_COLOR_PRESETS, DEFAULT_BOOKMARK_COLOR } from './types';

interface BookmarkEditModalProps {
    bookmark: UserBookmark;
    onSave: (data: UserBookmarkUpdate) => Promise<void>;
    onClose: () => void;
}

const ColorSwatch: React.FC<{
    background: string;
    text: string;
    label: string;
    selected: boolean;
    onClick: () => void;
}> = ({ background, text, label, selected, onClick }) => (
    <button
        title={label}
        onClick={onClick}
        style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            backgroundColor: background,
            border: selected ? `3px solid ${text}` : '2px solid transparent',
            cursor: 'pointer',
            boxShadow: selected ? `0 0 0 1px ${text}` : 'none',
            flexShrink: 0,
        }}
    />
);

export const BookmarkEditModal: React.FC<BookmarkEditModalProps> = ({ bookmark, onSave, onClose }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const initialColorId = BOOKMARK_COLOR_PRESETS.find(
        p => p.background === bookmark.color_background && p.text === bookmark.color_text,
    )?.id ?? DEFAULT_BOOKMARK_COLOR.id;

    const [title, setTitle] = useState(bookmark.page_title);
    const [description, setDescription] = useState(bookmark.description ?? '');
    const [colorId, setColorId] = useState(initialColorId);
    const [saving, setSaving] = useState(false);

    const selectedColor = BOOKMARK_COLOR_PRESETS.find(p => p.id === colorId) ?? DEFAULT_BOOKMARK_COLOR;

    const handleSave = async () => {
        if (!title.trim()) return;
        setSaving(true);
        try {
            await onSave({
                page_title: title.trim(),
                description: description.trim() || null,
                color_text: selectedColor.text,
                color_background: selectedColor.background,
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const overlayStyle: React.CSSProperties = {
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    };

    const modalStyle: React.CSSProperties = {
        backgroundColor: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxWidth: 'calc(100vw - 32px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '13px',
        fontWeight: 600,
        color: theme.colors.text,
        marginBottom: '4px',
        display: 'block',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '8px 12px',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '6px',
        fontSize: '14px',
        color: theme.colors.text,
        backgroundColor: theme.colors.surface,
        boxSizing: 'border-box',
        outline: 'none',
    };

    const btnStyle = (primary?: boolean): React.CSSProperties => ({
        padding: '8px 16px',
        borderRadius: '6px',
        border: primary ? 'none' : `1px solid ${theme.colors.border}`,
        backgroundColor: primary ? theme.colors.primary : 'transparent',
        color: primary ? '#fff' : theme.colors.text,
        cursor: saving ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: 600,
        opacity: saving && primary ? 0.7 : 1,
    });

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>
                <div style={{ fontWeight: 700, fontSize: '16px', color: theme.colors.text }}>
                    {t('bookmarks.edit.title')}
                </div>

                <div>
                    <label style={labelStyle}>{t('bookmarks.edit.name')}</label>
                    <input
                        style={inputStyle}
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        maxLength={200}
                    />
                </div>

                <div>
                    <label style={labelStyle}>{t('bookmarks.edit.description')}</label>
                    <textarea
                        style={{ ...inputStyle, resize: 'vertical', minHeight: '64px' }}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={2}
                    />
                </div>

                <div>
                    <label style={labelStyle}>{t('bookmarks.edit.color')}</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', justifyItems: 'center' }}>
                        {BOOKMARK_COLOR_PRESETS.map(preset => (
                            <ColorSwatch
                                key={preset.id}
                                background={preset.background}
                                text={preset.text}
                                label={preset.label}
                                selected={colorId === preset.id}
                                onClick={() => setColorId(preset.id)}
                            />
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button style={btnStyle()} onClick={onClose} disabled={saving}>
                        {t('common.cancel')}
                    </button>
                    <button style={btnStyle(true)} onClick={handleSave} disabled={saving || !title.trim()}>
                        {t('common.save')}
                    </button>
                </div>
            </div>
        </div>
    );
};
