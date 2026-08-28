import { ManageLabelsModal } from '@/app/platform/core/layout/themes/components/ManageLabelsModal.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { JournalLabel } from './types.ts';

interface Props {
  labels: JournalLabel[];
  activeLabelIds: string[];
  onToggle: (labelId: string) => void;
  onCreateLabel: (name: string, color: string) => Promise<void>;
  onUpdateLabel: (labelId: string, updates: { name?: string; color?: string }) => Promise<void>;
  onDeleteLabel: (labelId: string) => Promise<void>;
  onReorderLabel: (orderedIds: string[]) => Promise<void>;
}

const JournalLabelPicker: React.FC<Props> = ({
  labels, activeLabelIds, onToggle, onCreateLabel, onUpdateLabel, onDeleteLabel, onReorderLabel,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

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
          {labels.length === 0 && (
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
            <button type="button" onClick={() => { setOpen(false); setManaging(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', padding: '5px 8px', background: 'none', border: 'none', borderRadius: '5px', cursor: 'pointer', color: theme.colors.primary, fontSize: '11px', fontWeight: 600 }}>
              <ThemedSvgIcon name="pencil" color={theme.colors.primary} size={12} />
              {t('labels.manage')}
            </button>
          </div>
        </div>
      )}

      <ManageLabelsModal
        isOpen={managing}
        onClose={() => setManaging(false)}
        labels={labels}
        onCreate={onCreateLabel}
        onUpdate={onUpdateLabel}
        onDelete={onDeleteLabel}
        onReorder={onReorderLabel}
      />
    </div>
  );
};

export default JournalLabelPicker;
