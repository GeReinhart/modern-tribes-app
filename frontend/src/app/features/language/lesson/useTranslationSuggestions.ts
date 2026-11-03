import { useRef, useState } from 'react';

import { languageService } from '../shared/service.ts';
import { TranslationCandidate } from '../shared/types.ts';

export type SuggestionSide = 'left' | 'right';

interface TranslationSuggestionsState {
  side: SuggestionSide | null;
  loading: boolean;
  // null = no lookup requested yet (or cleared); [] is itself a real answer: "no match found".
  candidates: TranslationCandidate[] | null;
  // True once the candidates come from the online service rather than the bundled dictionary.
  online: boolean;
}

interface Query {
  side: SuggestionSide;
  text: string;
  from: string;
  to: string;
  // The text is a noun's plural form (online lookups then translate it as a plural).
  plural: boolean;
}

const IDLE_STATE: TranslationSuggestionsState = { side: null, loading: false, candidates: null, online: false };

// Shared by AddWordForm and EditWordForm (fixes the duplicated `handleSuggest` logic that used
// to live in both): looks up translation candidates for either column of the two-column word
// form, and remembers which side asked so only that column renders the results. Only one lookup
// is shown at a time -- suggesting from the other column, or picking a candidate, replaces it.
// When the dictionary finds nothing, `searchOnline` repeats the same lookup against the online
// service -- never automatically, because it sends the typed text to a third party.
export function useTranslationSuggestions() {
  const [state, setState] = useState<TranslationSuggestionsState>(IDLE_STATE);
  const lastQuery = useRef<Query | null>(null);

  const run = async (query: Query, online: boolean, keptCandidates?: TranslationCandidate[]) => {
    // The online answer is added after the dictionary's candidates, which stay pickable.
    const kept = keptCandidates ?? (online ? state.candidates ?? [] : []);
    setState({ side: query.side, loading: true, candidates: online ? kept : null, online });
    try {
      const result = online
        ? await languageService.getOnlineTranslationSuggestion(query.text, query.from, query.to, query.plural)
        : await languageService.getTranslationSuggestion(query.text, query.from, query.to);
      const added = result.suggestions.filter((s) => !kept.some((k) => k.text.toLowerCase() === s.text.toLowerCase()));
      setState({ side: query.side, loading: false, candidates: [...kept, ...added], online });
    } catch {
      setState({ side: query.side, loading: false, candidates: kept, online });
    }
  };

  const suggest = async (
    side: SuggestionSide, queryText: string, fromLanguage: string, toLanguage: string, plural = false,
  ) => {
    const text = queryText.trim();
    if (!text) return;
    lastQuery.current = { side, text, from: fromLanguage, to: toLanguage, plural };
    await run(lastQuery.current, false);
  };

  const searchOnline = async () => {
    if (lastQuery.current) await run(lastQuery.current, true);
  };

  // Online search straight from a typed word (no dictionary lookup first): shown like any lookup.
  const suggestOnline = async (side: SuggestionSide, queryText: string, fromLanguage: string, toLanguage: string) => {
    const text = queryText.trim();
    if (!text) return;
    lastQuery.current = { side, text, from: fromLanguage, to: toLanguage, plural: false };
    await run(lastQuery.current, true, []);
  };

  const clear = () => setState(IDLE_STATE);

  return { ...state, suggest, searchOnline, suggestOnline, clear };
}
