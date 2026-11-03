import { ManageLabelsModal } from '@/app/platform/core/layout/themes/components/ManageLabelsModal.tsx';
import { ThemedFilterPill } from '@/app/platform/core/layout/themes/components/ThemedFilterPill.tsx';
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
  filterLabelIds: string[];
  onFilter: (id: string) => void;
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
  filterLabelIds,
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
      {labels.map((label) => (
        <ThemedFilterPill
          key={label.id}
          label={label.name}
          color={label.color}
          active={filterLabelIds.includes(label.id)}
          enabled={activeLabelIds.has(label.id)}
          onClick={() => onFilter(label.id)}
        />
      ))}
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
