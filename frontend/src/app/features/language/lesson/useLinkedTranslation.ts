import { useCallback, useState } from 'react';

import { columnFromSummary, columnFromWord, WordColumnState } from './wordColumn.ts';
import { languageService } from '../shared/service.ts';
import { LanguageSettings, WordSummary } from '../shared/types.ts';

type SetColumn = (column: WordColumnState) => void;

// Picking a word that already exists (it was added in another lesson) brings along the
// translation it already has in the other column's language, locked like the picked word itself.
// `linkedTranslationId` remembers that pair is already linked, so adding it doesn't try to link
// it again.
export function useLinkedTranslation(languageSettings: LanguageSettings, setLeft: SetColumn, setRight: SetColumn) {
  const [linkedTranslationId, setLinkedTranslationId] = useState<string | null>(null);

  const pickExisting = useCallback(async (side: 'left' | 'right', summary: WordSummary) => {
    const [setThis, setOther, otherLanguage] = side === 'left'
      ? [setLeft, setRight, languageSettings.target_language] as const
      : [setRight, setLeft, languageSettings.source_language] as const;
    setThis(columnFromSummary(summary));
    setLinkedTranslationId(null);
    try {
      const word = await languageService.getWord(summary.id);
      const translation = word.translations.find((t) => t.language === otherLanguage);
      if (translation) {
        setOther(columnFromWord(translation, otherLanguage));
        setLinkedTranslationId(translation.id);
      }
    } catch {
      // The translation simply isn't brought along; the user can still enter it by hand.
    }
  }, [languageSettings, setLeft, setRight]);

  const resetLink = useCallback(() => setLinkedTranslationId(null), []);
  return { linkedTranslationId, pickExisting, resetLink };
}
