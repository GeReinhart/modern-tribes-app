import { ManageLabelsModal } from '@/app/platform/core/layout/themes/components/ManageLabelsModal.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RecipeLabel } from './types.ts';

interface Props {
  labels: RecipeLabel[];
  selectedLabelIds: string[];
  canEdit: boolean;
  showTitle?: boolean;
  onToggle: (labelId: string) => void;
  onCreate: (name: string, color: string) => Promise<void>;
  onUpdate: (labelId: string, data: { name?: string; color?: string }) => Promise<void>;
  onDelete: (labelId: string) => Promise<void>;
  onReorder: (orderedIds: string[]) => Promise<void>;
}

const RecipeLabelsSection: React.FC<Props> = ({
  labels, selectedLabelIds, canEdit, showTitle = true, onToggle, onCreate, onUpdate, onDelete, onReorder,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [managing, setManaging] = useState(false);

  return (
    <div>
      {showTitle && (
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('features.recipes.labels')}</div>
      )}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {labels.map((label) => {
          const selected = selectedLabelIds.includes(label.id);
          return (
            <button
              key={label.id}
              type="button"
              onClick={() => canEdit && onToggle(label.id)}
              style={{
                border: `1px solid ${label.color}`,
                background: selected ? label.color : 'transparent',
                color: selected ? '#fff' : label.color,
                borderRadius: '10px',
                padding: '2px 10px',
                fontSize: 'var(--font-xs)',
                cursor: canEdit ? 'pointer' : 'default',
              }}
            >
              {label.name}
            </button>
          );
        })}
        {canEdit && (
          <button
            type="button"
            onClick={() => setManaging(true)}
            title={t('labels.manage')}
            aria-label={t('labels.manage')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: 'var(--radius-md)',
              border: `1px solid ${theme.colors.border}`, background: 'transparent',
              color: theme.colors.primary, cursor: 'pointer',
            }}
          >
            <ThemedSvgIcon name="pencil" color="currentColor" size={14} />
          </button>
        )}
      </div>
      {canEdit && (
        <ManageLabelsModal
          isOpen={managing}
          onClose={() => setManaging(false)}
          labels={labels}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onReorder={onReorder}
        />
      )}
    </div>
  );
};

export default RecipeLabelsSection;
