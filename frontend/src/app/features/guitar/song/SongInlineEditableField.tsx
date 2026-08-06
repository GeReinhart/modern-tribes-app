import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useState } from 'react';

interface SongInlineEditableTextProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  style?: React.CSSProperties;
}

export const SongInlineEditableText: React.FC<SongInlineEditableTextProps> = ({
  value, onSave, placeholder, maxLength, style,
}) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    if (draft !== value) onSave(draft);
  };

  return (
    <ThemedInput
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      placeholder={placeholder}
      maxLength={maxLength}
      style={style}
    />
  );
};

interface SongInlineEditableNumberProps {
  value: number;
  onSave: (value: number) => Promise<void>;
  min: number;
  max: number;
  // How much the +/- step buttons nudge the value by, e.g. 1 for a plain integer count.
  step?: number;
  ariaLabel: string;
  label?: string;
  leftIcon?: React.ReactNode;
  style?: React.CSSProperties;
}

// Typing commits on blur, like every other field here -- but a quick nudge by exactly `step`
// via the +/- buttons commits immediately on click instead, since that's a single, already
// fully-formed action with nothing left to type afterward.
export const SongInlineEditableNumber: React.FC<SongInlineEditableNumberProps> = ({
  value, onSave, min, max, step = 1, ariaLabel, label, leftIcon, style,
}) => {
  const { theme } = useTheme();
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    if (draft !== value) onSave(draft);
  };

  const stepBy = (delta: number) => {
    const next = Math.min(max, Math.max(min, draft + delta));
    if (next === draft) return;
    setDraft(next);
    onSave(next);
  };

  const stepButtonStyle = (disabled: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '19px',
    border: 'none', background: 'none', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
  });

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
      <ThemedInput
        type="number"
        min={min}
        max={max}
        value={draft}
        onChange={(e) => setDraft(Number(e.target.value))}
        onBlur={commit}
        aria-label={ariaLabel}
        title={ariaLabel}
        label={label}
        leftIcon={leftIcon}
        className="song-number-input"
        // A floor, not a fixed size -- large enough that a 2-3 digit value is never clipped even
        // when a caller's own wrapper leaves little room; an explicit style.width (if passed)
        // still wins whenever it's larger than this.
        style={{ minWidth: '52px', ...style }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => stepBy(step)}
          disabled={draft >= max}
          aria-label={`${ariaLabel} +${step}`}
          title={`${ariaLabel} +${step}`}
          style={stepButtonStyle(draft >= max)}
        >
          <ThemedSvgIcon name="chevron-up" size={12} color={theme.colors.text} />
        </button>
        <button
          type="button"
          onClick={() => stepBy(-step)}
          disabled={draft <= min}
          aria-label={`${ariaLabel} -${step}`}
          title={`${ariaLabel} -${step}`}
          style={{ ...stepButtonStyle(draft <= min), borderTop: `1px solid ${theme.colors.border}` }}
        >
          <ThemedSvgIcon name="chevron-down" size={12} color={theme.colors.text} />
        </button>
      </div>
    </div>
  );
};
