import type { AttemptDirection, TestMode } from '../shared/scoreTypes.ts';

export type { AttemptDirection, Direction, LessonScoreResponse, TestMode, WordAttempt, WordScore } from '../shared/scoreTypes.ts';

export interface TestAnswerSubmit {
  word_id: string;
  direction: AttemptDirection;
  mode: TestMode;
  answer?: string;
  chosen_word_id?: string;
}

// The answer the user gave; `typed` is false when it was picked among choices.
export interface GivenAnswer {
  text: string;
  typed: boolean;
}

export interface TestAnswerResult {
  correct: boolean;
  correct_answer: string;
  word_score: number;
}
