import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';

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
  ariaLabel: string;
  label?: string;
  leftIcon?: React.ReactNode;
  style?: React.CSSProperties;
}

// Only ever saves on blur, never on every keystroke -- an onChange that saves directly triggers
// a row replace (and thus a reload) per keystroke, which regenerates the row's column/block ids
// server-side and remounts the whole row subtree while the user is still typing or holding the
// native spinner buttons, kicking focus out from under them and (if the field lives inside one)
// closing its popover.
export const SongInlineEditableNumber: React.FC<SongInlineEditableNumberProps> = ({
  value, onSave, min, max, ariaLabel, label, leftIcon, style,
}) => {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    if (draft !== value) onSave(draft);
  };

  return (
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
      style={style}
    />
  );
};
