import { useCallback, useState } from 'react';

import { Lesson } from './types.ts';

const storageKey = (projectId: string) => `language.selectedLesson.${projectId}`;

const readStored = (projectId: string): string | null => {
  try {
    return localStorage.getItem(storageKey(projectId));
  } catch {
    return null;
  }
};

const writeStored = (projectId: string, lessonId: string | null): void => {
  try {
    if (lessonId) localStorage.setItem(storageKey(projectId), lessonId);
    else localStorage.removeItem(storageKey(projectId));
  } catch {
    // Storage unavailable: the selection simply isn't carried over to the other tabs.
  }
};

// The lesson picked in any of the lesson / learn / test tabs, remembered per project so that
// switching to another of these tabs opens straight onto the same lesson. A remembered lesson
// that is no longer in the (loaded) list is ignored.
export function useSelectedLesson(projectId: string, lessons: Lesson[]) {
  const [storedId, setStoredId] = useState<string | null>(() => readStored(projectId));

  const select = useCallback((lessonId: string | null) => {
    setStoredId(lessonId);
    writeStored(projectId, lessonId);
  }, [projectId]);

  const isStale = storedId !== null && lessons.length > 0 && !lessons.some((l) => l.id === storedId);
  return { selectedLessonId: isStale ? null : storedId, select };
}
