import { ThemedFilterPill } from '@/app/platform/core/layout/themes/components/ThemedFilterPill.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Language, WORD_TYPES, Word } from './types.ts';
import WordCompactRow from './WordCompactRow.tsx';

interface Props {
  words: Word[];
  languages: Language[];
  // Omit for a read-only list.
  onEditWord?: (wordId: string) => void;
  onRemoveWord?: (wordId: string) => void;
}

// A lesson's word list as a grid of compact cards, filterable by word type. Nothing selected
// means nothing filtered; the filter is a transient view choice, so it is not persisted.
const VocabularyTab: React.FC<Props> = ({ words, languages, onEditWord, onRemoveWord }) => {
  const { t } = useTranslation();
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const { theme } = useTheme();
  const toggleType = (type: string) =>
    setSelectedTypes((prev) => (prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]));
  const visibleWords = selectedTypes.length === 0 ? words : words.filter((w) => selectedTypes.includes(w.word_type));

  return (
    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {WORD_TYPES.map((type) => (
          <ThemedFilterPill
            key={type}
            label={t(`features.language.wordType.${type}`)}
            color={theme.colors.primary}
            active={selectedTypes.includes(type)}
            onClick={() => toggleType(type)}
          />
        ))}
      </div>
      {visibleWords.length === 0 && (
        <ThemedText variant="secondary" size="small">{t('features.language.noWords')}</ThemedText>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px' }}>
        {visibleWords.map((word) => (
          <WordCompactRow key={word.id} word={word} languages={languages} onEdit={onEditWord && (() => onEditWord(word.id))}
            onRemove={onRemoveWord && (() => onRemoveWord(word.id))} />
        ))}
      </div>
    </div>
  );
};

export default VocabularyTab;
