import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { ALL_NOTES, Note } from './noteTypes.ts';

interface Props {
  enabled: Note[];
  onChange: (enabled: Note[]) => void;
}

function makeNoteButtonStyle(
  primaryColor: string,
  surfaceColor: string,
  active: boolean,
  disabled: boolean,
): React.CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: '8px',
    border: `1px solid ${primaryColor}`,
    backgroundColor: active ? primaryColor : 'transparent',
    color: active ? surfaceColor : primaryColor,
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    minWidth: '44px',
    transition: 'all 0.15s',
  };
}

const NoteFilter: React.FC<Props> = ({ enabled, onChange }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const toggle = (note: Note) => {
    if (enabled.includes(note)) {
      if (enabled.length > 1) onChange(enabled.filter((n) => n !== note));
    } else {
      onChange([...enabled, note].sort((a, b) => ALL_NOTES.indexOf(a) - ALL_NOTES.indexOf(b)));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <span style={{ color: theme.colors.text, fontSize: '12px' }}>
        {t('features.guitarNotes.notes')}
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
      {ALL_NOTES.map((note) => {
        const active = enabled.includes(note);
        const isLast = enabled.length === 1 && active;
        return (
          <button
            key={note}
            type="button"
            onClick={() => toggle(note)}
            style={makeNoteButtonStyle(theme.colors.primary, theme.colors.surface, active, isLast)}
          >
            {note}
          </button>
        );
      })}
      </div>
    </div>
  );
};

export default NoteFilter;
