import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useState } from 'react';

interface Props {
  value: number;
  isDivisible: boolean;
  canEdit: boolean;
  onChange: (value: number) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  // Fires on every keystroke, before the value is committed — lets a caller show a live preview
  // of the typed quantity elsewhere on the page without lifting the editing state up itself.
  onPreview?: (text: string) => void;
}

// A quantity editor used anywhere a numeric quantity needs quick adjustment: step buttons for a
// non-divisible quantity (whole units only), or a free-typed number input plus +/-1 buttons for a
// divisible one. Committing happens on blur (typed value) or immediately (step buttons).
export const ThemedQuantityStepper: React.FC<Props> = ({
  value, isDivisible, canEdit, onChange, inputRef, onPreview,
}) => {
  const { theme } = useTheme();
  const [text, setText] = useState(String(value));
  const step = isDivisible ? 0.1 : 1;

  useEffect(() => {
    setText(String(value));
  }, [value]);

  const handleChange = (next: string) => {
    setText(next);
    onPreview?.(next);
  };

  const commit = () => {
    const parsed = Number(text);
    if (Number.isNaN(parsed)) {
      setText(String(value));
      return;
    }
    const rounded = isDivisible ? Math.round(parsed * 10) / 10 : Math.round(parsed);
    setText(String(rounded));
    if (rounded !== value) onChange(rounded);
  };

  const applyStep = (delta: number) => {
    const current = Number(text);
    const raw = Math.max(0, (Number.isNaN(current) ? value : current) + delta);
    const next = Math.round(raw * 100) / 100;
    setText(String(next));
    onChange(next);
  };

  const stepButtonStyle = {
    border: `1px solid ${theme.colors.border}`, background: 'transparent', cursor: 'pointer',
    color: theme.colors.text, borderRadius: '6px', height: '24px', fontSize: 'var(--font-xs)',
  };

  if (!isDivisible) {
    return (
      <>
        {canEdit && (
          <button type="button" onClick={() => applyStep(-5)} style={{ ...stepButtonStyle, width: '28px' }}>
            −5
          </button>
        )}
        {canEdit && (
          <button type="button" onClick={() => applyStep(-1)} style={{ ...stepButtonStyle, width: '24px' }}>
            −1
          </button>
        )}
        <span style={{ minWidth: '24px', textAlign: 'center', color: theme.colors.text, fontSize: 'var(--font-sm)' }}>
          {value}
        </span>
        {canEdit && (
          <button type="button" onClick={() => applyStep(1)} style={{ ...stepButtonStyle, width: '24px' }}>
            +1
          </button>
        )}
        {canEdit && (
          <button type="button" onClick={() => applyStep(5)} style={{ ...stepButtonStyle, width: '28px' }}>
            +5
          </button>
        )}
      </>
    );
  }

  return (
    <>
      {canEdit && (
        <button type="button" onClick={() => applyStep(-1)} style={{ ...stepButtonStyle, width: '24px' }}>
          −1
        </button>
      )}
      <div style={{ width: '76px' }}>
        <input
          ref={inputRef}
          type="number"
          min="0"
          step={step}
          value={text}
          disabled={!canEdit}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={commit}
          style={{
            width: '100%',
            padding: '6px 8px',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '6px',
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            fontSize: 'var(--font-sm)',
            boxSizing: 'border-box',
          }}
        />
      </div>
      {canEdit && (
        <button type="button" onClick={() => applyStep(1)} style={{ ...stepButtonStyle, width: '24px' }}>
          +1
        </button>
      )}
    </>
  );
};
