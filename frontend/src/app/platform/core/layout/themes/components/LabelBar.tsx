import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Tag } from 'lucide-react';

import LabelBarEditForm from './LabelBarEditForm.tsx';

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
  // Optional: when provided alongside canEditLabels, shows up/down arrows to
  // reorder labels instead of just filter/edit/delete.
  onReorder?: (orderedIds: string[]) => Promise<void>;
}

export const LabelBar: React.FC<LabelBarProps> = ({
  labels,
  activeLabelIds,
  filterLabelId,
  onFilter,
  canEditLabels,
  onUpdate,
  onDelete,
  onReorder,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (labels.length === 0) return null;

  const move = (index: number, direction: -1 | 1) => {
    if (!onReorder) return;
    const next = index + direction;
    if (next < 0 || next >= labels.length) return;
    const orderedIds = labels.map((l) => l.id);
    [orderedIds[index], orderedIds[next]] = [orderedIds[next], orderedIds[index]];
    onReorder(orderedIds);
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
      <Tag size={14} color={theme.colors.secondary} />
      {labels.map((label, index) => {
        const isActive = filterLabelId === label.id;
        const isUsed = activeLabelIds.has(label.id);

        if (editingId === label.id) {
          return (
            <LabelBarEditForm
              key={label.id}
              label={label}
              onSave={onUpdate}
              onCancel={() => setEditingId(null)}
            />
          );
        }

        return (
          <div key={label.id} style={{ display: 'flex', alignItems: 'center', gap: '2px', opacity: isUsed ? 1 : 0.5 }}>
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
                {onReorder && (
                  <>
                    <button
                      type="button"
                      title={t('labels.moveUp')}
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      style={{
                        background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer',
                        padding: '2px', display: 'flex', alignItems: 'center',
                        opacity: index === 0 ? 0.15 : 0.4,
                      }}
                    >
                      <ThemedSvgIcon name="chevron-up" color={theme.colors.secondary} size={12} />
                    </button>
                    <button
                      type="button"
                      title={t('labels.moveDown')}
                      onClick={() => move(index, 1)}
                      disabled={index === labels.length - 1}
                      style={{
                        background: 'none', border: 'none', cursor: index === labels.length - 1 ? 'default' : 'pointer',
                        padding: '2px', display: 'flex', alignItems: 'center',
                        opacity: index === labels.length - 1 ? 0.15 : 0.4,
                      }}
                    >
                      <ThemedSvgIcon name="chevron-down" color={theme.colors.secondary} size={12} />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  title={t('labels.edit')}
                  onClick={() => setEditingId(label.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', opacity: 0.4 }}
                >
                  <ThemedSvgIcon name="pencil" color={theme.colors.secondary} size={12} />
                </button>
                <button
                  type="button"
                  title={t('labels.delete')}
                  onClick={() => onDelete(label.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', opacity: 0.4 }}
                >
                  <ThemedSvgIcon name="x" color={theme.colors.danger} size={12} />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
