import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { triggerLessonPdfDownload } from './service.ts';

export const useLessonPdfDownload = (lessonId: string, lessonTitle: string) => {
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith('fr') ? 'fr' : 'en';
  const [downloading, setDownloading] = useState(false);

  // Stable identity: it feeds a memoized page-action list (see LearnTab), which must not change
  // on every render.
  const download = useCallback(async () => {
    setDownloading(true);
    try {
      await triggerLessonPdfDownload(lessonId, lessonTitle, lang);
    } finally {
      setDownloading(false);
    }
  }, [lessonId, lessonTitle, lang]);

  return { download, downloading };
};
