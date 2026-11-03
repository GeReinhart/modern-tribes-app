import { useEffect, useState } from 'react';

import { languageService } from '../shared/service.ts';
import { DictionaryWordMatch } from '../shared/types.ts';
import { useDebouncedValue } from '../shared/useDebouncedValue.ts';

// Same-language, prefix-based autocomplete from the bundled dict.cc data for the word CURRENTLY
// being typed in this column (e.g. typing "Ja" in a French column suggests "jambe") -- distinct
// from both the DB word-search dropdown (an existing word already in the shared dictionary) and
// the manual "Suggest translation" flow (a completed OTHER-column word's translation, see
// useTranslationSuggestions).
export function useDictionaryAutocomplete(
  text: string, languageCode: string, otherLanguageCode: string | undefined, enabled: boolean,
) {
  const debouncedText = useDebouncedValue(text, 350);
  const [matches, setMatches] = useState<DictionaryWordMatch[] | null>(null);
  const [matchesLoading, setMatchesLoading] = useState(false);

  useEffect(() => {
    const prefix = debouncedText.trim();
    if (!enabled || !otherLanguageCode || !prefix) {
      setMatches(null);
      return;
    }
    setMatchesLoading(true);
    languageService.searchDictionaryWords(languageCode, otherLanguageCode, prefix)
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setMatchesLoading(false));
  }, [debouncedText, languageCode, otherLanguageCode, enabled]);

  return { matches, matchesLoading };
}
