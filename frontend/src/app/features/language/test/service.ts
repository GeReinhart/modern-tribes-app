import { apiService } from '@/app/platform/core/api/api.service.ts';

import { CompetitionHistory, EffortHistory, LessonScoreResponse, ScoreHistory, TestAnswerResult, TestAnswerSubmit, TestMember } from './types.ts';

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

  async getEffort(lessonId: string, userId?: string): Promise<EffortHistory> {
    const query = userId ? `?user_id=${userId}` : '';
    return apiService.get<EffortHistory>(`${BASE}/lessons/${lessonId}/test/effort${query}`);
  }

  async getCompetition(lessonId: string): Promise<CompetitionHistory> {
    return apiService.get<CompetitionHistory>(`${BASE}/lessons/${lessonId}/test/competition`);
  }

  async getMembers(lessonId: string): Promise<TestMember[]> {
    return apiService.get<TestMember[]>(`${BASE}/lessons/${lessonId}/test/members`);
  }
}

export const testService = new TestService();
