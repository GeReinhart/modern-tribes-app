export type Direction = 'source_to_target' | 'target_to_source';
export type TestMode = 'free' | 'choice';
// The article and plural tests are recorded as attempts with their own direction.
export type AttemptDirection = Direction | 'article' | 'plural';

export interface WordAttempt {
  direction: AttemptDirection;
  mode: TestMode;
  correct: boolean;
  created_at: string;
}

export interface WordScore {
  word_id: string;
  score: number;
  attempts: WordAttempt[];
}

export interface LessonScoreResponse {
  overall_score: number;
  words: WordScore[];
}
