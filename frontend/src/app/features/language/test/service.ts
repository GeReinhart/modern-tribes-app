import { apiService } from '@/app/platform/core/api/api.service.ts';

import { LessonScoreResponse, ScoreHistory, TestAnswerResult, TestAnswerSubmit, TestMember } from './types.ts';

const BASE = '/features/tasks/language';

class TestService {
  async submitAnswer(lessonId: string, data: TestAnswerSubmit): Promise<TestAnswerResult> {
    return apiService.post<TestAnswerResult>(`${BASE}/lessons/${lessonId}/test/attempts`, data);
  }

  // Without `userId` the backend answers for the signed-in user.
  async getScore(lessonId: string, userId?: string): Promise<LessonScoreResponse> {
    const query = userId ? `?user_id=${userId}` : '';
    return apiService.get<LessonScoreResponse>(`${BASE}/lessons/${lessonId}/test/score${query}`);
  }

  async getScoreHistory(lessonId: string, userId?: string): Promise<ScoreHistory> {
    const query = userId ? `?user_id=${userId}` : '';
    return apiService.get<ScoreHistory>(`${BASE}/lessons/${lessonId}/test/score/history${query}`);
  }

  async getMembers(lessonId: string): Promise<TestMember[]> {
    return apiService.get<TestMember[]>(`${BASE}/lessons/${lessonId}/test/members`);
  }
}

export const testService = new TestService();
