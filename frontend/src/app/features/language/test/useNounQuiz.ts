import { useCallback, useEffect, useState } from 'react';

import { NounCandidate } from './nounQuiz.ts';
import { pickWeighted, wordWeight } from './quizPicker.ts';
import { testService } from './service.ts';
import { TestAnswerResult, TestMode } from './types.ts';
import { useLessonScore } from './useLessonScore.ts';

// Drives the article and plural tests (`fact`): the next noun is drawn weighted toward the lesson words with the
// lowest scores (like the random test), an answer is submitted, its result shown until the
// user continues.
export function useNounQuiz(lessonId: string, candidates: NounCandidate[], fact: 'article' | 'plural') {
  const { scoreData, loading, refetch: refetchScore } = useLessonScore(lessonId);
  const scoresReady = scoreData !== null || !loading;
  const [current, setCurrent] = useState<NounCandidate | null>(null);
  const [result, setResult] = useState<TestAnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickNext = useCallback(() => {
    const scoreByWordId = new Map((scoreData?.words ?? []).map((s) => [s.word_id, s.score]));
    setResult(null);
    setCurrent(pickWeighted(candidates, (c) => wordWeight(scoreByWordId.get(c.lessonWordId) ?? 0)));
  }, [candidates, scoreData]);

  // Keyed on what starts a new pick, not on `scoreData`: a score refresh after an answer must
  // not swap the noun whose result is being shown.
  useEffect(() => {
    if (scoresReady) pickNext();
    // eslint-disable-next-line
  }, [candidates, scoresReady]);

  const mode: TestMode = fact === 'article' ? 'choice' : 'free';
  const submit = useCallback(async (answer: string) => {
    if (!current) return;
    setSubmitting(true);
    setError(null);
    try {
      setResult(await testService.submitAnswer(lessonId, {
        word_id: current.entryId, direction: fact, mode, answer,
      }));
      refetchScore();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  }, [current, lessonId, mode, fact, refetchScore]);

  return { current, result, submitting, error, submit, continueToNext: pickNext };
}
