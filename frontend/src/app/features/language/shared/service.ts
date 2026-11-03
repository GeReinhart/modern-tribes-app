import { apiService } from '@/app/platform/core/api/api.service.ts';
import { DocumentRevision } from '@/app/platform/functions/documents/editor/documentRevisionTypes.ts';

import { isNotFoundError } from './errorMessage.ts';
import {
  DictionaryWordMatch, Language, LanguageSettings, LanguageSettingsCreate, Lesson, LessonDetail,
  LessonUpdate, TranslationInput, TranslationSuggestion, WordCreateInput, WordSummary, Word, WordUpdateInput,
} from './types.ts';

const BASE = '/features/tasks/language';

// Shared by all three tabs: lessons and their words belong to the project, not to one tab
// instance, so the lesson/learn/test tabs all read (and sometimes write) the exact same rows.
class LanguageService {
  async listLanguages(): Promise<Language[]> {
    return apiService.get<Language[]>(`${BASE}/languages`);
  }

  async updateLanguageTheme(code: string, themeCode: string | null): Promise<Language> {
    return apiService.patch<Language>(`${BASE}/languages/${code}`, { theme_code: themeCode });
  }

  async getSettings(projectId: string): Promise<LanguageSettings | null> {
    try {
      return await apiService.get<LanguageSettings>(`${BASE}/projects/${projectId}/settings`);
    } catch (e) {
      if (isNotFoundError(e)) return null;
      throw e;
    }
  }

  async setSettings(projectId: string, data: LanguageSettingsCreate): Promise<LanguageSettings> {
    return apiService.post<LanguageSettings>(`${BASE}/projects/${projectId}/settings`, data);
  }

  async listLessons(projectId: string): Promise<Lesson[]> {
    return apiService.get<Lesson[]>(`${BASE}/projects/${projectId}/lessons`);
  }

  async createLesson(projectId: string, title: string): Promise<Lesson> {
    return apiService.post<Lesson>(`${BASE}/projects/${projectId}/lessons`, { title });
  }

  async getLessonDetail(lessonId: string): Promise<LessonDetail> {
    return apiService.get<LessonDetail>(`${BASE}/lessons/${lessonId}/learn`);
  }

  async updateLesson(lessonId: string, data: LessonUpdate): Promise<Lesson> {
    return apiService.patch<Lesson>(`${BASE}/lessons/${lessonId}`, data);
  }

  async getLessonDocumentRevisions(lessonId: string): Promise<DocumentRevision[]> {
    return apiService.get<DocumentRevision[]>(`${BASE}/lessons/${lessonId}/document/revisions`);
  }

  async getWord(wordId: string): Promise<Word> {
    return apiService.get<Word>(`${BASE}/words/${wordId}`);
  }

  async searchWords(search: string, language?: string): Promise<WordSummary[]> {
    const query = new URLSearchParams({ search });
    if (language) query.set('language', language);
    return apiService.get<WordSummary[]>(`${BASE}/words?${query.toString()}`);
  }

  async addExistingWord(lessonId: string, wordId: string): Promise<{ lesson_id: string; word_id: string; text: string }> {
    return apiService.post(`${BASE}/lessons/${lessonId}/words/${wordId}`, {});
  }

  async removeWordFromLesson(lessonId: string, wordId: string): Promise<void> {
    await apiService.delete(`${BASE}/lessons/${lessonId}/words/${wordId}`);
  }

  async createWord(lessonId: string, data: WordCreateInput): Promise<Word> {
    return apiService.post<Word>(`${BASE}/lessons/${lessonId}/words`, data);
  }

  async updateWord(wordId: string, data: WordUpdateInput): Promise<Word> {
    return apiService.patch<Word>(`${BASE}/words/${wordId}`, data);
  }

  async addTranslation(wordId: string, data: TranslationInput): Promise<Word> {
    return apiService.post<Word>(`${BASE}/words/${wordId}/translations`, data);
  }

  async getTranslationSuggestion(
    text: string, sourceLanguage: string, targetLanguage: string,
  ): Promise<TranslationSuggestion> {
    const query = new URLSearchParams({ text, source_language: sourceLanguage, target_language: targetLanguage });
    return apiService.get<TranslationSuggestion>(`${BASE}/translate-suggestion?${query.toString()}`);
  }

  // A machine translation (the typed text is sent to an online service): only on explicit request,
  // when the bundled dictionary has no match. Carries no article, plural or type.
  async getOnlineTranslationSuggestion(
    text: string, sourceLanguage: string, targetLanguage: string,
  ): Promise<TranslationSuggestion> {
    const query = new URLSearchParams({ text, source_language: sourceLanguage, target_language: targetLanguage });
    return apiService.get<TranslationSuggestion>(`${BASE}/translate-suggestion/online?${query.toString()}`);
  }

  // Same-language, prefix-based autocomplete from the bundled dict.cc data -- `otherLanguage`
  // only locates the right bundled archive (the pair's data file), it is never the language
  // being searched.
  async searchDictionaryWords(language: string, otherLanguage: string, prefix: string): Promise<DictionaryWordMatch[]> {
    const query = new URLSearchParams({ language, other_language: otherLanguage, prefix });
    return apiService.get<DictionaryWordMatch[]>(`${BASE}/dictionary-words?${query.toString()}`);
  }
}

export const languageService = new LanguageService();
