import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import React, { useRef, useState } from 'react';
import type { JournalLabel } from './types.ts';

interface Props {
  labels: JournalLabel[];
  activeLabelIds: string[];
  onToggle: (labelId: string) => void;
}

const JournalLabelPicker: React.FC<Props> = ({ labels, activeLabelIds, onToggle }) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (labels.length === 0) return null;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        title="Labels"
        style={{
          background: 'none',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '6px',
          cursor: 'pointer',
          padding: '2px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          opacity: 0.7,
        }}
      >
        <ThemedSvgIcon name="hash" color={theme.colors.text} size={12} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 100,
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '8px',
            padding: '6px',
            minWidth: '140px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          }}
        >
          {labels.map(label => {
            const active = activeLabelIds.includes(label.id);
            return (
              <button
                key={label.id}
                type="button"
                onClick={() => { onToggle(label.id); setOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '5px 8px',
                  background: active ? label.color + '22' : 'none',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: active ? 700 : 400,
                  color: theme.colors.text,
                  fontSize: 'var(--font-sm)',
                }}
              >
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: label.color, flexShrink: 0 }} />
                {label.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JournalLabelPicker;
