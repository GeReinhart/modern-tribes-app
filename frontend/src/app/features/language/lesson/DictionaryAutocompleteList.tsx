import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import LookupResultList from './LookupResultList.tsx';
import { DictionaryWordMatch } from '../shared/types.ts';

interface Props {
  loading: boolean;
  matches: DictionaryWordMatch[] | null;
  onPick: (match: DictionaryWordMatch) => void;
}

// Same-language, prefix-based dictionary autocomplete for the column currently being typed in
// (see useDictionaryAutocomplete) -- deliberately tinted and labeled differently from the DB
// word-search dropdown shown just above it in WordColumnFields, since a row here is a dict.cc
// word, not an existing word already in the shared dictionary: picking one completes the
// column's text (and fills type/article when known) but never sets `wordId`. The word itself is
// always shown bare (never prefixed with its article) -- article and type are shown alongside it
// as separate badge/label, not concatenated into the word's own label.
const DictionaryAutocompleteList: React.FC<Props> = ({ loading, matches, onPick }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (!loading && matches === null) return null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px',
      backgroundColor: `${theme.colors.accent}1A`, borderLeft: `3px solid ${theme.colors.accent}`, borderRadius: 'var(--radius-sm)',
    }}
    >
      <ThemedText variant="secondary" size="small">{t('features.language.dictionaryHintLabel')}</ThemedText>
      <LookupResultList
        loading={loading}
        items={matches}
        itemKey={(match, index) => `${match.text}-${match.word_type ?? ''}-${match.article ?? ''}-${index}`}
        onPick={onPick}
        emptyMessage={t('features.language.noSuggestionFound')}
        containerStyle={{ border: 'none' }}
        renderItem={(match) => (
          <>
            {match.article && <ThemedBadge variant="accent">{match.article}</ThemedBadge>}
            <span>{match.text}</span>
            {match.word_type && <ThemedText variant="secondary" size="small">{t(`features.language.wordType.${match.word_type}`)}</ThemedText>}
          </>
        )}
      />
    </div>
  );
};

export default DictionaryAutocompleteList;
