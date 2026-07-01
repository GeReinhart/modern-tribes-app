import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JournalLabel } from './types.ts';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

interface Props {
  labels: JournalLabel[];
  activeLabelIds: string[];
  onToggle: (labelId: string) => void;
  onCreateLabel: (name: string, color: string) => Promise<void>;
}

const JournalLabelPicker: React.FC<Props> = ({ labels, activeLabelIds, onToggle, onCreateLabel }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) { setCreating(false); setNewName(''); setNewColor(PRESET_COLORS[0]); }
  }, [open]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await onCreateLabel(newName.trim(), newColor);
    setCreating(false);
    setNewName('');
    setNewColor(PRESET_COLORS[0]);
  };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          background: 'none',
          border: `1px dashed ${theme.colors.border}`,
          borderRadius: '10px',
          cursor: 'pointer',
          padding: '2px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: theme.colors.secondary,
          fontSize: '11px',
          fontWeight: 500,
        }}
      >
        + {t('journal.labels')}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          zIndex: 200,
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          padding: '6px',
          minWidth: '170px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
          marginTop: '4px',
        }}>
          {labels.length === 0 && !creating && (
            <div style={{ padding: '4px 8px', color: theme.colors.secondary, fontSize: '11px' }}>
              {t('journal.noLabel')}
            </div>
          )}
          {labels.map(label => {
            const active = activeLabelIds.includes(label.id);
            return (
              <button key={label.id} type="button"
                onClick={() => { onToggle(label.id); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '5px 8px', background: active ? label.color + '22' : 'none', border: 'none', borderRadius: '5px', cursor: 'pointer', textAlign: 'left', fontWeight: active ? 700 : 400, color: theme.colors.text, fontSize: 'var(--font-sm)' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: label.color, flexShrink: 0, border: active ? `2px solid ${label.color}` : 'none', outline: active ? `1px solid ${label.color}55` : 'none' }} />
                {label.name}
                {active && <span style={{ marginLeft: 'auto', color: label.color, fontSize: '10px' }}>✓</span>}
              </button>
            );
          })}

          <div style={{ borderTop: labels.length > 0 ? `1px solid ${theme.colors.border}` : 'none', marginTop: labels.length > 0 ? '4px' : 0, paddingTop: labels.length > 0 ? '4px' : 0 }}>
            {!creating ? (
              <button type="button" onClick={() => setCreating(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '5px 8px', background: 'none', border: 'none', borderRadius: '5px', cursor: 'pointer', color: theme.colors.primary, fontSize: '11px', fontWeight: 600 }}>
                + Create label
              </button>
            ) : (
              <div style={{ padding: '4px 2px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder="Label name"
                  style={{ width: '100%', padding: '4px 8px', borderRadius: '5px', border: `1px solid ${theme.colors.border}`, background: theme.colors.surface, color: theme.colors.text, fontSize: '12px', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewColor(c)}
                      style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: newColor === c ? `2px solid ${theme.colors.text}` : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button type="button" onClick={handleCreate} disabled={!newName.trim()}
                    style={{ flex: 1, padding: '4px', borderRadius: '5px', background: theme.colors.primary, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, opacity: newName.trim() ? 1 : 0.5 }}>
                    Create
                  </button>
                  <button type="button" onClick={() => setCreating(false)}
                    style={{ padding: '4px 8px', borderRadius: '5px', background: 'none', border: `1px solid ${theme.colors.border}`, cursor: 'pointer', fontSize: '11px', color: theme.colors.secondary }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalLabelPicker;
