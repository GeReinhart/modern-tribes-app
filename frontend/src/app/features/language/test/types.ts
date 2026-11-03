export type Direction = 'source_to_target' | 'target_to_source';
export type TestMode = 'free' | 'choice';
// The article and plural tests are recorded as attempts with their own direction.
export type AttemptDirection = Direction | 'article' | 'plural';

export interface TestAnswerSubmit {
  word_id: string;
  direction: AttemptDirection;
  mode: TestMode;
  answer?: string;
  chosen_word_id?: string;
}

export interface TestAnswerResult {
  correct: boolean;
  correct_answer: string;
  word_score: number;
}

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

export interface ScoreHistoryPoint {
  date: string;
  score: number;
}

export interface ScoreHistory {
  points: ScoreHistoryPoint[];
}

export interface TestMember {
  user_id: string;
  name: string;
}

export interface LessonScoreResponse {
  overall_score: number;
  words: WordScore[];
}
