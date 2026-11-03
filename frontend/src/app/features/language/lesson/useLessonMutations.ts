import { useCallback, useState } from 'react';

import { errorMessage } from '../shared/errorMessage.ts';
import { languageService } from '../shared/service.ts';
import { LessonUpdate } from '../shared/types.ts';

// Updates the lesson itself (title and/or document content) -- used both by the title field
// and by the document editor's save/autosave, each sending only the field it owns.
export function useLessonMutations(lessonId: string, refetch: () => Promise<void>, onUpdated?: () => void) {
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (data: LessonUpdate): Promise<boolean> => {
    try {
      await languageService.updateLesson(lessonId, data);
      await refetch();
      onUpdated?.();
      return true;
    } catch (e: unknown) {
      setError(errorMessage(e));
      return false;
    }
  }, [lessonId, refetch, onUpdated]);

  const updateTitle = useCallback((title: string) => update({ title }), [update]);
  const updateDocument = useCallback((contentHtml: string) => update({ document_content_html: contentHtml }), [update]);

  return { updateTitle, updateDocument, error };
}
