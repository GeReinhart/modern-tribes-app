import { ColorSwatchPicker } from '@/app/platform/core/layout/themes/components/ColorSwatchPicker.tsx';
import { ManageLabelsRow } from '@/app/platform/core/layout/themes/components/ManageLabelsRow.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { LABEL_COLORS } from '@/app/platform/core/layout/themes/themes.ts';
import { useSystemLabelSearch } from '@/app/platform/functions/labels/useSystemLabelSearch.ts';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface ManagedLabel {
  id: string;
  name: string;
  color: string;
}

export interface ManageLabelsPanelProps {
  labels: ManagedLabel[];
  usageCounts?: Record<string, number>;
  onCreate: (name: string, color: string) => Promise<void>;
  onUpdate: (id: string, updates: { name?: string; color?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder?: (orderedIds: string[]) => Promise<void>;
}

export const ManageLabelsPanel: React.FC<ManageLabelsPanelProps> = ({
  labels, usageCounts, onCreate, onUpdate, onDelete, onReorder,
}) => {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(LABEL_COLORS[0]);
  const [creating, setCreating] = useState(false);

  const suggestions = useSystemLabelSearch(newName).filter(
    (s) => !labels.some((l) => l.name.toLowerCase() === s.name.toLowerCase()),
  );

  const move = (index: number, direction: -1 | 1) => {
    if (!onReorder) return;
    const next = index + direction;
    if (next < 0 || next >= labels.length) return;
    const orderedIds = labels.map((l) => l.id);
    [orderedIds[index], orderedIds[next]] = [orderedIds[next], orderedIds[index]];
    onReorder(orderedIds);
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      await onCreate(trimmed, newColor);
      setNewName('');
      setNewColor(LABEL_COLORS[0]);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
        {labels.length === 0 && (
          <span style={{ fontSize: 'var(--font-sm)', opacity: 0.6 }}>{t('labels.none')}</span>
        )}
        {labels.map((label, index) => (
          <ManageLabelsRow
            key={label.id}
            label={label}
            usageCount={usageCounts?.[label.id]}
            canMoveUp={index > 0}
            canMoveDown={index < labels.length - 1}
            onMoveUp={onReorder ? () => move(index, -1) : undefined}
            onMoveDown={onReorder ? () => move(index, 1) : undefined}
            onUpdate={(updates) => onUpdate(label.id, updates)}
            onDelete={() => onDelete(label.id)}
          />
        ))}
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(128,128,128,0.2)' }}>
        <ThemedInput
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t('labels.newLabelPlaceholder')}
        />
        {suggestions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {suggestions.slice(0, 5).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setNewName(s.name); setNewColor(s.color); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px',
                  borderRadius: '10px', border: `1px solid ${s.color}`, background: 'transparent',
                  color: s.color, fontSize: 'var(--font-xs)', cursor: 'pointer',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
        <ColorSwatchPicker colors={LABEL_COLORS} value={newColor} onChange={setNewColor} size={18} />
        <ThemedButton onClick={handleCreate} disabled={!newName.trim()} isLoading={creating} fullWidth={false}>
          {t('labels.createLabel')}
        </ThemedButton>
      </div>
    </div>
  );
};
