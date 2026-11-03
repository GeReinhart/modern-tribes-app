import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Language, Word } from './types.ts';
import WordCompactCard from './WordCompactCard.tsx';

interface Props {
  word: Word;
  languages: Language[];
  // Without it the card is read-only (no pencil).
  onEdit?: () => void;
  // Without it there is no remove button (the word is only detached from the lesson).
  onRemove?: () => void;
}

// Wraps the compact, read-only WordCompactCard with an optional edit affordance (lesson tab) --
// mirrors the pencil-icon pattern used on other list rows (e.g. daily-journal's JournalBlockCard).
const WordCompactRow: React.FC<Props> = ({ word, languages, onEdit, onRemove }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div style={{ position: 'relative' }}>
      <WordCompactCard word={word} languages={languages} />
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title={t('features.language.editWord')}
          style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.6 }}
        >
          <ThemedSvgIcon name="pencil" color={theme.colors.text} size={13} />
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          title={t('features.language.removeWordFromLesson')}
          style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.6 }}
        >
          <ThemedSvgIcon name="trash" color={theme.colors.text} size={13} />
        </button>
      )}
    </div>
  );
};

export default WordCompactRow;
