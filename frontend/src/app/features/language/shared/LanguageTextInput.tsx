import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';

import React, { useRef } from 'react';

import { SPECIAL_CHARACTER_BY_LANGUAGE } from './specialCharacters.ts';

// Fixed width of the special-character button, so a neighbouring field can reserve the same room.
const SPECIAL_BUTTON_WIDTH = '2rem';

type InputProps = Omit<React.ComponentProps<typeof ThemedInput>, 'onChange' | 'value'>;

interface Props extends InputProps {
  value: string;
  onValueChange: (value: string) => void;
  // The language the text is typed in; German adds a "ß" button right next to the field.
  language?: string;
  // Layout of the whole control (field + button), e.g. `{ flex: 1 }` in a flex row.
  containerStyle?: React.CSSProperties;
  // Leaves the room of the special-character button empty, so this field is as wide as a
  // sibling field that has the button (e.g. the declension case next to its form).
  reserveButtonSpace?: boolean;
}

// A text field for words in a given language. Use it wherever the user types text in a language
// -- the shared place for language-specific typing helpers, so every such field gets them.
const LanguageTextInput: React.FC<Props> = ({ value, onValueChange, language, containerStyle, reserveButtonSpace, disabled, ...inputProps }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const specialCharacter = language ? SPECIAL_CHARACTER_BY_LANGUAGE[language] : undefined;

  // Inserts the character at the caret (replacing any selection), then puts the caret right
  // after it, as if it had been typed.
  const insertSpecialCharacter = () => {
    if (!specialCharacter) return;
    const input = containerRef.current?.querySelector('input');
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? value.length;
    onValueChange(value.slice(0, start) + specialCharacter + value.slice(end));
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + specialCharacter.length, start + specialCharacter.length);
    });
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', ...containerStyle }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <ThemedInput {...inputProps} value={value} disabled={disabled} onChange={(e) => onValueChange(e.target.value)} />
      </div>
      {specialCharacter && !disabled && (
        <ThemedButton
          type="button" variant="secondary" fullWidth={false} title={specialCharacter}
          style={{ width: SPECIAL_BUTTON_WIDTH, height: SPECIAL_BUTTON_WIDTH, minHeight: 0, padding: 0, fontSize: 'var(--font-sm)' }} onClick={insertSpecialCharacter}
        >
          {specialCharacter}
        </ThemedButton>
      )}
      {reserveButtonSpace && !specialCharacter && <div style={{ width: SPECIAL_BUTTON_WIDTH, flexShrink: 0 }} />}
    </div>
  );
};

export default LanguageTextInput;
