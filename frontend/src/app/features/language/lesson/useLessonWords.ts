import { useCallback, useState } from 'react';

import { errorMessage } from '../shared/errorMessage.ts';
import { languageService } from '../shared/service.ts';
import { TranslationInput, WordCreateInput, WordUpdateInput } from '../shared/types.ts';

export function useLessonWords(lessonId: string, refetch: () => Promise<void>) {
  const [error, setError] = useState<string | null>(null);

  // `translation` is only passed when the reused word doesn't already carry the translation
  // the user entered in the other column — see AddWordForm.tsx.
  const addExisting = useCallback(async (wordId: string, translation?: TranslationInput): Promise<boolean> => {
    try {
      await languageService.addExistingWord(lessonId, wordId);
      if (translation) await languageService.addTranslation(wordId, translation);
      await refetch();
      return true;
    } catch (e: unknown) {
      setError(errorMessage(e));
      return false;
    }
  }, [lessonId, refetch]);

  const createWord = useCallback(async (data: WordCreateInput): Promise<boolean> => {
    try {
      await languageService.createWord(lessonId, data);
      await refetch();
      return true;
    } catch (e: unknown) {
      setError(errorMessage(e));
      return false;
    }
  }, [lessonId, refetch]);

  const updateWord = useCallback(async (wordId: string, data: WordUpdateInput): Promise<boolean> => {
    try {
      await languageService.updateWord(wordId, data);
      await refetch();
      return true;
    } catch (e: unknown) {
      setError(errorMessage(e));
      return false;
    }
  }, [refetch]);

  // Detaches the word from this lesson only -- the word stays in the shared dictionary.
  const removeWord = useCallback(async (wordId: string): Promise<boolean> => {
    try {
      await languageService.removeWordFromLesson(lessonId, wordId);
      await refetch();
      return true;
    } catch (e: unknown) {
      setError(errorMessage(e));
      return false;
    }
  }, [lessonId, refetch]);

  return { addExisting, createWord, updateWord, removeWord, error };
}
