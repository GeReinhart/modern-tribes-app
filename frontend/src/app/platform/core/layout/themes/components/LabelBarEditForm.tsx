import { ColorSwatchPicker } from '@/app/platform/core/layout/themes/components/ColorSwatchPicker.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LabelBarItem } from './LabelBar.tsx';

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#6b7280', '#10b981',
];

interface Props {
  label: LabelBarItem;
  onSave: (id: string, updates: { name?: string; color?: string }) => Promise<void>;
  onCancel: () => void;
}

const LabelBarEditForm: React.FC<Props> = ({ label, onSave, onCancel }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [name, setName] = useState(label.name);
  const [color, setColor] = useState(label.color);

  const save = async () => {
    const trimmed = name.trim();
    const updates: { name?: string; color?: string } = {};
    if (trimmed && trimmed !== label.name) updates.name = trimmed;
    if (color !== label.color) updates.color = color;
    if (Object.keys(updates).length > 0) await onSave(label.id, updates);
    onCancel();
  };

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: '6px', padding: '8px',
        border: `1px solid ${theme.colors.border}`, borderRadius: '8px', backgroundColor: theme.colors.surface,
      }}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') onCancel();
        }}
        style={{
          padding: '4px 8px', borderRadius: '6px', fontSize: 'var(--font-xs)',
          border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.surface,
          color: theme.colors.text, outline: 'none',
        }}
      />
      <ColorSwatchPicker colors={COLOR_PALETTE} value={color} onChange={setColor} size={18} />
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          type="button"
          onClick={save}
          style={{
            flex: 1, padding: '3px 6px', fontSize: 'var(--font-xs)', borderRadius: '4px',
            backgroundColor: theme.colors.primary, color: theme.colors.surface, border: 'none', cursor: 'pointer',
          }}
        >
          {t('common.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '3px 6px', fontSize: 'var(--font-xs)', borderRadius: '4px', backgroundColor: 'transparent',
            color: theme.colors.secondary, border: `1px solid ${theme.colors.border}`, cursor: 'pointer',
          }}
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
};

export default LabelBarEditForm;
