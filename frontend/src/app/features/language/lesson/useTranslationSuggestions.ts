import { useState } from 'react';

import { languageService } from '../shared/service.ts';
import { TranslationCandidate } from '../shared/types.ts';

export type SuggestionSide = 'left' | 'right';

interface TranslationSuggestionsState {
  side: SuggestionSide | null;
  loading: boolean;
  // null = no lookup requested yet (or cleared); [] is itself a real answer: "no match found".
  candidates: TranslationCandidate[] | null;
}

const IDLE_STATE: TranslationSuggestionsState = { side: null, loading: false, candidates: null };

// Shared by AddWordForm and EditWordForm (fixes the duplicated `handleSuggest` logic that used
// to live in both): looks up translation candidates for either column of the two-column word
// form, and remembers which side asked so only that column renders the results. Only one lookup
// is shown at a time -- suggesting from the other column, or picking a candidate, replaces it.
export function useTranslationSuggestions() {
  const [state, setState] = useState<TranslationSuggestionsState>(IDLE_STATE);

  const suggest = async (side: SuggestionSide, queryText: string, fromLanguage: string, toLanguage: string) => {
    const text = queryText.trim();
    if (!text) return;
    setState({ side, loading: true, candidates: null });
    try {
      const result = await languageService.getTranslationSuggestion(text, fromLanguage, toLanguage);
      setState({ side, loading: false, candidates: result.suggestions });
    } catch {
      setState({ side, loading: false, candidates: [] });
    }
  };

  const clear = () => setState(IDLE_STATE);

  return { ...state, suggest, clear };
}
