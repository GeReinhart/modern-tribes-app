import React from 'react';

interface ThemedFilterPillProps {
  label: string;
  color: string;
  active: boolean;
  // A disabled pill stays visible but dimmed and non-clickable (e.g. a label no item uses).
  enabled?: boolean;
  onClick: () => void;
}

// Small selectable text pill used for filtering lists (labels, word types...).
export const ThemedFilterPill: React.FC<ThemedFilterPillProps> = ({ label, color, active, enabled = true, onClick }) => (
  <button
    type="button"
    onClick={() => {
      if (enabled) onClick();
    }}
    style={{
      padding: '4px 12px',
      borderRadius: '16px',
      fontSize: 'var(--font-xs)',
      fontWeight: active ? 700 : 500,
      cursor: enabled ? 'pointer' : 'default',
      border: `1px solid ${color}`,
      backgroundColor: active ? `${color}20` : 'transparent',
      color,
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
      opacity: enabled ? 1 : 0.5,
    }}
  >
    {label}
  </button>
);
