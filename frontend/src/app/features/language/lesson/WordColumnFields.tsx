import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import WordDetailFields from './WordDetailFields.tsx';
import DictionaryAutocompleteList from './DictionaryAutocompleteList.tsx';
import { useDictionaryAutocomplete } from './useDictionaryAutocomplete.ts';
import { WordColumnState } from './wordColumn.ts';
import LanguageTextInput from '../shared/LanguageTextInput.tsx';
import { useWordSearch } from '../shared/useWordSearch.ts';
import { DictionaryWordMatch, WordSummary } from '../shared/types.ts';

interface Props {
  languageCode: string;
  themeCode?: string;
  value: WordColumnState;
  onChange: (value: WordColumnState) => void;
  searchEnabled: boolean;
  // Type/plural/declensions, shown only for the language being learned (not the known one).
  detailed?: boolean;
  // The OTHER column's language, needed to locate the right bundled dict.cc archive for this
  // column's own-language autocomplete -- unknown while e.g. editing a word that has no
  // translation yet.
  otherLanguageCode?: string;
  onPickWord?: (word: WordSummary) => void;
  onClearPick?: () => void;
  suggestAction?: React.ReactNode;
  suggestionsPanel?: React.ReactNode;
}

// One column of the two-column word form: a text field (a live dictionary search box in the
// add flow, a plain field while editing) plus type/article/plural/declensions, locked and
// filled from the picked word once an existing one is reused. Colored by the column's own
// language theme (see shared/languageTheme.ts), same as everywhere else a word is shown.
const WordColumnFields: React.FC<Props> = ({ themeCode, ...contentProps }) => (
  <ThemedSection themeId={themeCode}>
    <WordColumnFieldsContent {...contentProps} />
  </ThemedSection>
);

type ContentProps = Omit<Props, 'themeCode'>;

const WordColumnFieldsContent: React.FC<ContentProps> = ({
  languageCode, value, onChange, searchEnabled, detailed, otherLanguageCode, onPickWord, onClearPick, suggestAction, suggestionsPanel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const locked = searchEnabled && Boolean(value.wordId);

  // Searches (the DB dropdown and the dict.cc autocomplete) must only run while the user is
  // actively typing this column's text -- not when it was just filled by a pick: a same-column
  // dict.cc match, a plural pick, or a translation suggestion applied from the other column (all
  // of those call onChange directly, bypassing handleTextChange, so the ref falls out of sync
  // with value.text and searches stay suppressed until the user types again). `suppressedByPick`
  // covers the one case the ref can't: picking the exact-match row (its text equals what was
  // already typed, so the ref alone wouldn't notice anything changed).
  const lastUserTypedTextRef = useRef<string | null>(null);
  const [suppressedByPick, setSuppressedByPick] = useState(false);
  const searchSuppressed = suppressedByPick || value.text !== lastUserTypedTextRef.current;
  const handleTextChange = (text: string) => {
    lastUserTypedTextRef.current = text;
    setSuppressedByPick(false);
    onChange({ ...value, text });
  };

  const showDropdown = searchEnabled && !value.wordId && value.text.trim().length > 0 && !searchSuppressed;
  const { results, loading } = useWordSearch(showDropdown ? value.text : '', languageCode);

  const autocompleteEnabled = searchEnabled && !value.wordId && value.text.trim().length > 0 && !searchSuppressed;
  const { matches, matchesLoading } = useDictionaryAutocomplete(value.text, languageCode, otherLanguageCode, autocompleteEnabled);
  const showAutocomplete = autocompleteEnabled && Boolean(otherLanguageCode);

  // Completes the column's text from a same-language dict.cc word (e.g. "Ja" -> "jambe") and
  // fills in its type/article when dict.cc knows them -- never sets `wordId`, this isn't an
  // existing word in the shared dictionary, just a dictionary-sourced completion.
  const applyAutocompleteMatch = (match: DictionaryWordMatch) => {
    onChange({
      ...value,
      text: match.text,
      wordType: match.word_type ?? value.wordType,
      article: match.article ?? value.article,
    });
    setSuppressedByPick(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-md)', padding: '10px' }}>
      <ThemedText size="small" variant="secondary">{t(`features.language.code.${languageCode}`)}</ThemedText>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <div style={{ width: '5.5rem', flexShrink: 0 }}>
          <ThemedInput
            aria-label={t('features.language.article')}
            value={value.article}
            disabled={locked}
            onChange={(e) => onChange({ ...value, article: e.target.value })}
          />
        </div>
        <LanguageTextInput
          aria-label={t('features.language.wordText')}
          value={value.text}
          language={languageCode}
          disabled={locked}
          placeholder={searchEnabled ? t('features.language.searchWordPlaceholder') : undefined}
          onValueChange={handleTextChange}
          containerStyle={{ flex: 1 }}
        />
        {suggestAction}
      </div>

      {locked && (
        <ThemedButton
          type="button" variant="ghost" fullWidth={false} icon="x" iconOnly
          style={{ alignSelf: 'flex-start' }} onClick={onClearPick}
        >
          {t('features.language.changeWord')}
        </ThemedButton>
      )}

      {showDropdown && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <ThemedText variant="secondary" size="small">{t('features.language.lessonWordsHintLabel')}</ThemedText>
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '160px', overflowY: 'auto', border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-sm)' }}>
            {loading && <ThemedLoadingSpinner size="sm" />}
            {!loading && results.length === 0 && (
              <ThemedText variant="secondary" size="small" style={{ padding: '6px' }}>{t('features.language.noMatchingWord')}</ThemedText>
            )}
            {results.map((word) => (
              <div
                key={word.id}
                onClick={() => onPickWord?.(word)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', cursor: 'pointer', borderBottom: `1px solid ${theme.colors.border}` }}
              >
                <span>{word.text}</span>
                <ThemedBadge variant="secondary">{t(`features.language.wordType.${word.word_type}`)}</ThemedBadge>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAutocomplete && (
        <DictionaryAutocompleteList loading={matchesLoading} matches={matches} onPick={applyAutocompleteMatch} />
      )}

      {suggestionsPanel}

      {detailed && <WordDetailFields value={value} locked={locked} onChange={onChange} />}
    </div>
  );
};

export default WordColumnFields;
