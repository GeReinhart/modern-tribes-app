import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import SuggestionList from './SuggestionList.tsx';
import { useLinkedTranslation } from './useLinkedTranslation.ts';
import { useSyncedWordType } from './useSyncedWordType.ts';
import { useTranslationSuggestions } from './useTranslationSuggestions.ts';
import WordColumnFields from './WordColumnFields.tsx';
import {
  applyTranslationCandidate, createEmptyColumn, isColumnValid, toTranslationInput,
  toWordCreateInput, WordColumnState,
} from './wordColumn.ts';
import { themeCodeForLanguage } from '../shared/languageTheme.ts';
import { Language, LanguageSettings, TranslationCandidate, TranslationInput, WordCreateInput } from '../shared/types.ts';

interface Props {
  // The lesson the word is added to, named at the top of the form (the page title lives in the header).
  lessonTitle: string;
  languageSettings: LanguageSettings;
  languages: Language[];
  onAddExisting: (wordId: string, translation?: TranslationInput) => Promise<boolean>;
  onCreateWord: (data: WordCreateInput) => Promise<boolean>;
}

// One page, two columns: left = the project's source language (the primary word added to the
// lesson), right = its target-language translation. Picking a dropdown suggestion in a column
// reuses that existing word (locked fields); typing without picking one creates a brand-new word.
// When the left column reuses an existing word, the right column becomes optional -- it's sent
// as a translation to link onto that existing word instead of a brand-new word's own fields.
const AddWordForm: React.FC<Props> = ({ lessonTitle, languageSettings, languages, onAddExisting, onCreateWord }) => {
  const { t } = useTranslation();
  const [left, setLeft] = useState<WordColumnState>(() => createEmptyColumn(languageSettings.source_language));
  const [right, setRight] = useState<WordColumnState>(() => createEmptyColumn(languageSettings.target_language));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);
  const suggestions = useTranslationSuggestions();

  const rightRequired = !left.wordId;
  const isValid = isColumnValid(left) && (!rightRequired || isColumnValid(right));

  // Dismisses the "word added" banner as soon as the user acts on the form again (typing,
  // picking a word, clearing a pick) -- used in place of setLeft/setRight everywhere except the
  // post-submit reset itself, which sets justAdded back to true right after.
  const updateLeft = (next: React.SetStateAction<WordColumnState>) => { setLeft(next); setJustAdded(false); };
  const updateRight = (next: React.SetStateAction<WordColumnState>) => { setRight(next); setJustAdded(false); };
  useSyncedWordType(left, updateLeft, Boolean(left.wordId), right, updateRight, Boolean(right.wordId));

  const { linkedTranslationId, pickExisting, resetLink } = useLinkedTranslation(languageSettings, updateLeft, updateRight);

  const pickLeft = (candidate: TranslationCandidate) => {
    updateLeft((prev) => applyTranslationCandidate(prev, candidate));
    suggestions.clear();
  };
  const pickRight = (candidate: TranslationCandidate) => {
    updateRight((prev) => applyTranslationCandidate(prev, candidate));
    suggestions.clear();
  };

  // On success the form resets to a blank word rather than leaving the page -- adding several
  // words in a row is the common case, so staying here (with a confirmation) saves a trip back
  // and forth through the lesson tab for every single word.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    const translationToLink = isColumnValid(right) && right.wordId !== linkedTranslationId ? toTranslationInput(right) : undefined;
    const ok = left.wordId
      ? await onAddExisting(left.wordId, translationToLink)
      : await onCreateWord(toWordCreateInput(left, right));
    setSubmitting(false);
    if (ok) {
      setLeft(createEmptyColumn(languageSettings.source_language));
      setRight(createEmptyColumn(languageSettings.target_language));
      suggestions.clear();
      resetLink();
      setJustAdded(true);
    } else {
      setError(t('features.language.addWordError'));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <ThemedText variant="secondary" size="small">{t('features.language.addingToLesson', { title: lessonTitle })}</ThemedText>
      {justAdded && <ThemedText variant="success" size="small">{t('features.language.wordAddedKeepAdding')}</ThemedText>}
      {error && <ThemedText variant="danger" size="small">{error}</ThemedText>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <WordColumnFields
          languageCode={languageSettings.source_language}
          themeCode={themeCodeForLanguage(languages, languageSettings.source_language)}
          value={left}
          onChange={updateLeft}
          searchEnabled
          otherLanguageCode={languageSettings.target_language}
          onPickWord={(word) => pickExisting('left', word)}
          onClearPick={() => { resetLink(); updateLeft(createEmptyColumn(languageSettings.source_language)); }}
          suggestAction={(
            <ThemedButton type="button" variant="secondary" fullWidth={false} icon="zap" iconOnly
              isLoading={suggestions.loading && suggestions.side === 'left'} disabled={!right.text.trim()}
              onClick={() => suggestions.suggest('left', right.text, right.language, left.language)}>
              {t('features.language.suggestTranslation')}
            </ThemedButton>
          )}
          suggestionsPanel={suggestions.side === 'left' && (
            <SuggestionList loading={suggestions.loading} candidates={suggestions.candidates} onPick={pickLeft} />
          )}
        />
        <WordColumnFields
          languageCode={languageSettings.target_language}
          themeCode={themeCodeForLanguage(languages, languageSettings.target_language)}
          value={right}
          onChange={updateRight}
          detailed
          searchEnabled
          otherLanguageCode={languageSettings.source_language}
          onPickWord={(word) => pickExisting('right', word)}
          onClearPick={() => { resetLink(); updateRight(createEmptyColumn(languageSettings.target_language)); }}
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
      </div>
      {!rightRequired && (
        <ThemedText variant="secondary" size="small">{t('features.language.reusedWordOptionalTranslationHint')}</ThemedText>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <ThemedButton variant="primary" type="submit" icon="check" iconOnly isLoading={submitting} disabled={!isValid}>
          {t('features.language.addWord')}
        </ThemedButton>
      </div>
    </form>
  );
};

export default AddWordForm;
