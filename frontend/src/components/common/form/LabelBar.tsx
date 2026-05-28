import { ThemedSvgIcon } from '@/platform/themes/icons/ThemedSvgIcon';
import { useTheme } from '@/platform/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Tag } from 'lucide-react';

const COLOR_PALETTE = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#6b7280',
  '#10b981',
];

export interface LabelBarItem {
  id: string;
  name: string;
  color: string;
}

interface LabelBarProps {
  labels: LabelBarItem[];
  activeLabelIds: Set<string>;
  filterLabelId: string | null;
  onFilter: (id: string | null) => void;
  canEditLabels: boolean;
  onUpdate: (
    id: string,
    data: { name?: string; color?: string },
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const LabelBar: React.FC<LabelBarProps> = ({
  labels,
  activeLabelIds,
  filterLabelId,
  onFilter,
  canEditLabels,
  onUpdate,
  onDelete,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  if (labels.length === 0) return null;

  const startEdit = (label: LabelBarItem) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (label: LabelBarItem) => {
    const name = editName.trim();
    const updates: { name?: string; color?: string } = {};
    if (name && name !== label.name) updates.name = name;
    if (editColor !== label.color) updates.color = editColor;
    if (Object.keys(updates).length > 0) await onUpdate(label.id, updates);
    cancelEdit();
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        alignItems: 'center',
      }}
    >
      <Tag size={14} color={theme.colors.secondary} />
      {labels.map((label) => {
        const isActive = filterLabelId === label.id;
        const isUsed = activeLabelIds.has(label.id);

        if (editingId === label.id) {
          return (
            <div
              key={label.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '8px',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '8px',
                backgroundColor: theme.colors.surface,
              }}
            >
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit(label);
                  if (e.key === 'Escape') cancelEdit();
                }}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: 'var(--font-xs)',
                  border: `1px solid ${theme.colors.border}`,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditColor(c)}
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border:
                        editColor === c
                          ? `2px solid ${theme.colors.text}`
                          : '2px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => saveEdit(label)}
                  style={{
                    flex: 1,
                    padding: '3px 6px',
                    fontSize: 'var(--font-xs)',
                    borderRadius: '4px',
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.surface,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  style={{
                    padding: '3px 6px',
                    fontSize: 'var(--font-xs)',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    color: theme.colors.secondary,
                    border: `1px solid ${theme.colors.border}`,
                    cursor: 'pointer',
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={label.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              opacity: isUsed ? 1 : 0.5,
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (isUsed) onFilter(isActive ? null : label.id);
              }}
              style={{
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: 'var(--font-xs)',
                fontWeight: isActive ? 700 : 500,
                cursor: isUsed ? 'pointer' : 'default',
                border: `1px solid ${label.color}`,
                backgroundColor: isActive ? `${label.color}20` : 'transparent',
                color: label.color,
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {label.name}
            </button>
            {canEditLabels && (
              <>
                <button
                  type="button"
                  title={t('labels.edit')}
                  onClick={() => startEdit(label)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 0.4,
                  }}
                >
                  <ThemedSvgIcon
                    name="pencil"
                    color={theme.colors.secondary}
                    size={12}
                  />
                </button>
                <button
                  type="button"
                  title={t('labels.delete')}
                  onClick={() => onDelete(label.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 0.4,
                  }}
                >
                  <ThemedSvgIcon
                    name="x"
                    color={theme.colors.danger}
                    size={12}
                  />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
