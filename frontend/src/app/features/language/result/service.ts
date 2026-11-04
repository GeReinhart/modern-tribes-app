import { apiService } from '@/app/platform/core/api/api.service.ts';

import { CompetitionHistory, EffortHistory, ResultMember, ScoreHistory } from './types.ts';
import { LessonScoreResponse } from '../shared/scoreTypes.ts';

const BASE = '/features/tasks/language';

class ResultService {
  // Without `userId` the backend answers for the signed-in user.
  async getScore(lessonId: string, userId?: string): Promise<LessonScoreResponse> {
    return apiService.get<LessonScoreResponse>(`${BASE}/lessons/${lessonId}/result/score${this.userQuery(userId)}`);
  }

  async getScoreHistory(lessonId: string, userId?: string): Promise<ScoreHistory> {
    return apiService.get<ScoreHistory>(`${BASE}/lessons/${lessonId}/result/score/history${this.userQuery(userId)}`);
  }

  async getEffort(lessonId: string, userId?: string): Promise<EffortHistory> {
    return apiService.get<EffortHistory>(`${BASE}/lessons/${lessonId}/result/effort${this.userQuery(userId)}`);
  }

  async getCompetition(lessonId: string): Promise<CompetitionHistory> {
    return apiService.get<CompetitionHistory>(`${BASE}/lessons/${lessonId}/result/competition`);
  }

  async getMembers(lessonId: string): Promise<ResultMember[]> {
    return apiService.get<ResultMember[]>(`${BASE}/lessons/${lessonId}/result/members`);
  }

  private userQuery(userId?: string): string {
    return userId ? `?user_id=${userId}` : '';
  }
}

export const resultService = new ResultService();
