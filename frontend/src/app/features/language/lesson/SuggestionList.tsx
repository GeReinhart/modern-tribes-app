import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import LookupResultList from './LookupResultList.tsx';
import { TranslationCandidate } from '../shared/types.ts';

interface Props {
  loading: boolean;
  candidates: TranslationCandidate[] | null;
  onPick: (candidate: TranslationCandidate) => void;
}

// Renders the outcome of one translation lookup for a word column: every candidate dict.cc
// returned for that headword -- several senses of the same word are common (see backend
// local_dictionary.py), so the user picks the one they meant rather than having the first one
// guessed for them. Shared by AddWordForm and EditWordForm via WordColumnFields' `suggestionsPanel`
// slot, so the list itself is never re-implemented per form; the loading/empty/row skeleton comes
// from LookupResultList, shared in turn with DictionaryAutocompleteList.
const SuggestionList: React.FC<Props> = ({ loading, candidates, onPick }) => {
  const { t } = useTranslation();

  return (
    <LookupResultList
      loading={loading}
      items={candidates}
      itemKey={(candidate, index) => `${candidate.text}-${candidate.context ?? ''}-${index}`}
      onPick={onPick}
      emptyMessage={t('features.language.noSuggestionFound')}
      renderItem={(candidate) => (
        <>
          {candidate.article && <ThemedBadge variant="secondary">{candidate.article}</ThemedBadge>}
          <span>{candidate.text}</span>
          {candidate.context && <ThemedText variant="secondary" size="small">[{candidate.context}]</ThemedText>}
        </>
      )}
    />
  );
};

export default SuggestionList;
