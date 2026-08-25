import { ColorSwatchPicker } from '@/app/platform/core/layout/themes/components/ColorSwatchPicker.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RecipeLabel } from './types.ts';

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#6b7280', '#10b981',
];

interface Props {
  labels: RecipeLabel[];
  selectedLabelIds: string[];
  canEdit: boolean;
  showTitle?: boolean;
  onToggle: (labelId: string) => void;
  onCreate: (name: string, color: string) => Promise<void>;
}

const RecipeLabelsSection: React.FC<Props> = ({
  labels, selectedLabelIds, canEdit, showTitle = true, onToggle, onCreate,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await onCreate(name.trim(), color);
    setName('');
    setCreating(false);
  };

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
        {canEdit && !creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            title={t('features.recipes.newLabel')}
            aria-label={t('features.recipes.newLabel')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: 'var(--radius-md)',
              border: `1px solid ${theme.colors.border}`, background: 'transparent',
              color: theme.colors.primary, cursor: 'pointer',
            }}
          >
            <ThemedSvgIcon name="plus" color="currentColor" size={16} />
          </button>
        )}
      </div>
      {creating && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
          <ThemedInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <ColorSwatchPicker colors={COLOR_PALETTE} value={color} onChange={setColor} />
          <ThemedButton variant="primary" onClick={handleCreate} disabled={!name.trim()}>
            {t('features.recipes.create')}
          </ThemedButton>
          <ThemedButton variant="ghost" onClick={() => setCreating(false)}>
            {t('features.recipes.cancel')}
          </ThemedButton>
        </div>
      )}
    </div>
  );
};

export default RecipeLabelsSection;
