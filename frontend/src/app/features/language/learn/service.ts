import { apiService } from '@/app/platform/core/api/api.service.ts';

const BASE = '/features/tasks/language';

class LearnService {
  async downloadPdf(lessonId: string, lang: string): Promise<Blob> {
    return apiService.getBlob(`${BASE}/lessons/${lessonId}/learn/pdf?lang=${lang}`);
  }
}

export const learnService = new LearnService();

export const triggerLessonPdfDownload = async (lessonId: string, lessonTitle: string, lang: string): Promise<void> => {
  const blob = await learnService.downloadPdf(lessonId, lang);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${lessonTitle}.pdf`;
  link.click();
  // Also open it for viewing, same as saving a regular file then opening it — delay the
  // revoke so the just-opened tab has time to actually load the blob before it's freed.
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};
