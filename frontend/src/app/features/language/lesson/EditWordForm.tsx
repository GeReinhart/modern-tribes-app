import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import SuggestionList from './SuggestionList.tsx';
import { useSyncedWordType } from './useSyncedWordType.ts';
import { useTranslationSuggestions } from './useTranslationSuggestions.ts';
import WordColumnFields from './WordColumnFields.tsx';
import {
  applyTranslationCandidate, columnFieldsEqual, columnFromWord, isColumnValid, toWordUpdateInput, WordColumnState,
} from './wordColumn.ts';
import { themeCodeForLanguage } from '../shared/languageTheme.ts';
import { Language, TranslationCandidate, Word, WordUpdateInput } from '../shared/types.ts';

interface Props {
  // The lesson the word is edited from, named at the top of the form (the page title lives in the header).
  lessonTitle: string;
  word: Word;
  languages: Language[];
  onUpdateWord: (wordId: string, data: WordUpdateInput) => Promise<boolean>;
  onDone: () => void;
}

// The same two-column layout as AddWordForm, pre-filled from an existing word and its first
// translation, both editable in place. Translations themselves are never added/removed/relinked
// here -- only the word's own fields (text/type/article/plural/declensions) can change.
const EditWordForm: React.FC<Props> = ({ lessonTitle, word, languages, onUpdateWord, onDone }) => {
  const { t } = useTranslation();
  const translation = word.translations[0] ?? null;
  const initialLeft = useMemo(() => columnFromWord(word, word.language), [word]);
  const initialRight = useMemo(
    () => (translation ? columnFromWord(translation, translation.language) : null),
    [translation],
  );
  const [left, setLeft] = useState<WordColumnState>(initialLeft);
  const [right, setRight] = useState<WordColumnState | null>(initialRight);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestions = useTranslationSuggestions();

  const isValid = isColumnValid(left) && (!right || isColumnValid(right));
  useSyncedWordType(left, setLeft, false, right, setRight, false);

  const pickLeft = (candidate: TranslationCandidate) => {
    setLeft((prev) => applyTranslationCandidate(prev, candidate));
    suggestions.clear();
  };
  const pickRight = (candidate: TranslationCandidate) => {
    setRight((prev) => (prev ? applyTranslationCandidate(prev, candidate) : prev));
    suggestions.clear();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    let ok = true;
    if (!columnFieldsEqual(initialLeft, left)) {
      ok = await onUpdateWord(word.id, toWordUpdateInput(left));
    }
    if (ok && right && initialRight && translation && !columnFieldsEqual(initialRight, right)) {
      ok = await onUpdateWord(translation.id, toWordUpdateInput(right));
    }
    setSubmitting(false);
    if (ok) onDone();
    else setError(t('features.language.updateWordError'));
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ThemedText variant="secondary" size="small">{t('features.language.editingInLesson', { title: lessonTitle })}</ThemedText>
      {error && <ThemedText variant="danger" size="small">{error}</ThemedText>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <WordColumnFields
          languageCode={word.language}
          themeCode={themeCodeForLanguage(languages, word.language)}
          value={left}
          onChange={setLeft}
          searchEnabled={false}
          otherLanguageCode={right?.language}
          suggestAction={right && (
            <ThemedButton type="button" variant="secondary" fullWidth={false} icon="zap" iconOnly
              isLoading={suggestions.loading && suggestions.side === 'left'} disabled={!right.text.trim()}
              onClick={() => right && suggestions.suggest('left', right.text, right.language, left.language)}>
              {t('features.language.suggestTranslation')}
            </ThemedButton>
          )}
          suggestionsPanel={Boolean(right) && suggestions.side === 'left' && (
            <SuggestionList loading={suggestions.loading} candidates={suggestions.candidates} onPick={pickLeft} />
          )}
        />
        {right && (
          <WordColumnFields
            languageCode={right.language}
            themeCode={themeCodeForLanguage(languages, right.language)}
            value={right}
            onChange={setRight}
            detailed
            searchEnabled={false}
            otherLanguageCode={left.language}
            suggestAction={(
              <ThemedButton type="button" variant="secondary" fullWidth={false} icon="zap" iconOnly
                isLoading={suggestions.loading && suggestions.side === 'right'} disabled={!left.text.trim()}
                onClick={() => suggestions.suggest('right', left.text, left.language, right.language)}>
                {t('features.language.suggestTranslation')}
              </ThemedButton>
            )}
            suggestionsPanel={suggestions.side === 'right' && (
              <SuggestionList loading={suggestions.loading} candidates={suggestions.candidates} onPick={pickRight} />
            )}
          />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <ThemedButton variant="primary" type="submit" icon="save" iconOnly isLoading={submitting} disabled={!isValid}>
          {t('features.language.saveChanges')}
        </ThemedButton>
      </div>
    </form>
  );
};

export default EditWordForm;
