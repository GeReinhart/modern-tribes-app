import { PluralTranslateButton } from './PluralInput.tsx';
import SuggestionList from './SuggestionList.tsx';
import { useTranslationSuggestions } from './useTranslationSuggestions.ts';
import { WordColumnState } from './wordColumn.ts';

// Translates the plural typed in the known language's column into the learned language's
// plural field: first from the dictionary, then (on request) online, through the same proposal
// list as the word's own translation. Shared by AddWordForm and EditWordForm.
export function usePluralTranslation(
  source: WordColumnState, target: WordColumnState, onTargetChange: (next: WordColumnState) => void,
) {
  const suggestions = useTranslationSuggestions();
  const canTranslate = source.wordType === 'noun' && source.plural.trim().length > 0;

  const action = (
    <PluralTranslateButton
      disabled={!canTranslate} loading={suggestions.loading}
      onClick={() => suggestions.suggest('right', source.plural, source.language, target.language)}
    />
  );
  const panel = suggestions.side === 'right' && (
    <SuggestionList
      loading={suggestions.loading} candidates={suggestions.candidates} online={suggestions.online}
      onSearchOnline={suggestions.searchOnline}
      onPick={(candidate) => {
        onTargetChange({ ...target, plural: candidate.text });
        suggestions.clear();
      }}
    />
  );
  return { action, panel, clear: suggestions.clear };
}
