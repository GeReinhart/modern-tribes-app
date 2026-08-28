import { ManageLabelsModal } from '@/app/platform/core/layout/themes/components/ManageLabelsModal.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Tag } from 'lucide-react';

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
  usageCounts?: Record<string, number>;
  onCreate: (name: string, color: string) => Promise<void>;
  onUpdate: (id: string, updates: { name?: string; color?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder?: (orderedIds: string[]) => Promise<void>;
}

export const LabelBar: React.FC<LabelBarProps> = ({
  labels,
  activeLabelIds,
  filterLabelId,
  onFilter,
  canEditLabels,
  usageCounts,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [managing, setManaging] = useState(false);

  if (labels.length === 0 && !canEditLabels) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
      <Tag size={14} color={theme.colors.secondary} />
      {labels.map((label) => {
        const isActive = filterLabelId === label.id;
        const isUsed = activeLabelIds.has(label.id);

        return (
          <button
            key={label.id}
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
              opacity: isUsed ? 1 : 0.5,
            }}
          >
            {label.name}
          </button>
        );
      })}
      {canEditLabels && (
        <button
          type="button"
          title={t('labels.manage')}
          onClick={() => setManaging(true)}
          style={{
            background: 'none', border: `1px dashed ${theme.colors.border}`, borderRadius: '16px',
            cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center',
          }}
        >
          <ThemedSvgIcon name="pencil" color={theme.colors.secondary} size={12} />
        </button>
      )}
      {canEditLabels && (
        <ManageLabelsModal
          isOpen={managing}
          onClose={() => setManaging(false)}
          labels={labels}
          usageCounts={usageCounts}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onReorder={onReorder}
        />
      )}
    </div>
  );
};
