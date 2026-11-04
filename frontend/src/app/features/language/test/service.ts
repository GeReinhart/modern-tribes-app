import { apiService } from '@/app/platform/core/api/api.service.ts';

import { LessonScoreResponse, TestAnswerResult, TestAnswerSubmit } from './types.ts';

const BASE = '/features/tasks/language';

class TestService {
  async submitAnswer(lessonId: string, data: TestAnswerSubmit): Promise<TestAnswerResult> {
    return apiService.post<TestAnswerResult>(`${BASE}/lessons/${lessonId}/test/attempts`, data);
  }

  // The signed-in user's own score; other members' scores are read by the result tab.
  async getScore(lessonId: string): Promise<LessonScoreResponse> {
    return apiService.get<LessonScoreResponse>(`${BASE}/lessons/${lessonId}/test/score`);
  }
}

export const testService = new TestService();
