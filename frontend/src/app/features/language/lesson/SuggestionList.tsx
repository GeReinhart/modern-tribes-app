import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import LookupResultList from './LookupResultList.tsx';
import { isOnlineRow, ONLINE_ROW, WithOnlineRow, withOnlineRow } from './onlineRow.ts';
import OnlineSearchRow from './OnlineSearchRow.tsx';
import { TranslationCandidate } from '../shared/types.ts';

interface Props {
  loading: boolean;
  candidates: TranslationCandidate[] | null;
  onPick: (candidate: TranslationCandidate) => void;
  // Asks the online service instead; offered only when the dictionary found nothing.
  onSearchOnline?: () => void;
  online?: boolean;
}

// Renders the outcome of one translation lookup for a word column: every candidate dict.cc
// returned for that headword -- several senses of the same word are common (see backend
// local_dictionary.py), so the user picks the one they meant rather than having the first one
// guessed for them. Shared by AddWordForm and EditWordForm via WordColumnFields' `suggestionsPanel`
// slot, so the list itself is never re-implemented per form; the loading/empty/row skeleton comes
// from LookupResultList, shared in turn with DictionaryAutocompleteList.
const SuggestionList: React.FC<Props> = ({ loading, candidates, onPick, onSearchOnline, online = false }) => {
  const { t } = useTranslation();
  const canSearchOnline = Boolean(onSearchOnline) && !online && !loading && candidates !== null;
  const rows = withOnlineRow(candidates, canSearchOnline);
  const noCandidates = canSearchOnline && candidates?.length === 0;
  const showOnlineNotice = online && !loading && Boolean(candidates?.length);

  const pick = (row: WithOnlineRow<TranslationCandidate>) => (isOnlineRow(row) ? onSearchOnline?.() : onPick(row));

  return (
    <>
      {noCandidates && (
        <ThemedText variant="secondary" size="small">{t('features.language.noSuggestionFound')}</ThemedText>
      )}
      <LookupResultList
        loading={loading}
        items={rows}
        itemKey={(row, index) => (isOnlineRow(row) ? ONLINE_ROW : `${row.text}-${row.context ?? ''}-${index}`)}
        onPick={pick}
        emptyMessage={t('features.language.noSuggestionFound')}
        renderItem={(row) => (isOnlineRow(row) ? <OnlineSearchRow /> : (
          <>
            {row.article && <ThemedBadge variant="secondary">{row.article}</ThemedBadge>}
            <span>{row.text}</span>
            {row.context && <ThemedText variant="secondary" size="small">[{row.context}]</ThemedText>}
          </>
        ))}
      />
      {showOnlineNotice && (
        <ThemedText variant="secondary" size="small">{t('features.language.onlineSuggestionNotice')}</ThemedText>
      )}
      {canSearchOnline && (
        <ThemedText variant="secondary" size="small">{t('features.language.searchOnlineHint')}</ThemedText>
      )}
    </>
  );
};

export default SuggestionList;
