import { useCallback, useEffect, useMemo, useState } from 'react';

import { buildQuizPrompt, pickRandomDirection, pickWeightedWord, QuizPrompt, shuffle } from './quizPicker.ts';
import { testService } from './service.ts';
import { Direction, GivenAnswer, TestAnswerResult, TestMode, WordScore } from './types.ts';
import { useLessonScore } from './useLessonScore.ts';
import { Word } from '../shared/types.ts';

interface QuizQuestion {
  word: Word;
  direction: Direction;
  prompt: QuizPrompt;
}

function pickQuestion(
  words: Word[], reviewMode: boolean, reviewIndex: number, scores: WordScore[], fixedDirection?: Direction,
): QuizQuestion | null {
  const word = reviewMode ? (words[reviewIndex] ?? null) : pickWeightedWord(words, scores);
  if (!word) return null;
  const direction = fixedDirection ?? pickRandomDirection();
  const prompt = buildQuizPrompt(word, direction);
  return prompt ? { word, direction, prompt } : null;
}

// Drives one quiz session for a lesson: picking the next word (weighted toward lower scores
// in the random test; every translated word once, in a shuffled order, in the full test),
// submitting an answer, and showing its result until the user asks to continue.
// `fixedDirection` pins every question to one direction (the full test's two sub-tabs); without
// it the direction is random on each question.
export function useQuizSession(lessonId: string, allWords: Word[], fullTest: boolean, fixedDirection?: Direction) {
  const { scoreData, loading: scoreLoading, refetch: refetchScore } = useLessonScore(lessonId);
  // The first pick must wait for the scores, otherwise every word weighs the same and the
  // first question is purely random. Later refreshes keep `scoreData`, so this stays true.
  const scoresReady = scoreData !== null || !scoreLoading;
  const [runId, setRunId] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  // The full test only walks words that can be quizzed (those with a translation), reshuffled
  // on each (re)start; the random test samples from all of them.
  const words = useMemo(
    () => (fullTest ? shuffle(allWords.filter((w) => w.translations.length > 0)) : allWords),
    [allWords, fullTest, runId], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const reviewMode = fullTest;
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [result, setResult] = useState<TestAnswerResult | null>(null);
  const [givenAnswer, setGivenAnswer] = useState<GivenAnswer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickNext = useCallback(() => {
    // A word with no translation yet can't be quizzed -- a few retries skips past it in
    // random mode (full review always lands on the exact next word, translated or not).
    const scores = scoreData?.words ?? [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const next = pickQuestion(words, reviewMode, reviewIndex, scores, fixedDirection);
      if (next || reviewMode) {
        setQuestion(next);
        return;
      }
    }
    setQuestion(null);
  }, [words, reviewMode, reviewIndex, scoreData, fixedDirection]);

  // Intentionally keyed only on what should start a *new* pick -- not on `scoreData`, so a
  // score refresh after submitting an answer doesn't swap out the question being reviewed.
  useEffect(() => {
    if (!scoresReady) return;
    setResult(null);
    pickNext();
    // eslint-disable-next-line
  }, [words, reviewMode, reviewIndex, scoresReady]);

  const restart = useCallback(() => {
    setReviewIndex(0);
    setRunId((id) => id + 1);
  }, []);

  const submit = useCallback(async (mode: TestMode, givenText: string, chosenWordId?: string) => {
    if (!question) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await testService.submitAnswer(lessonId, {
        word_id: question.prompt.testedWordId, direction: question.direction, mode,
        answer: mode === 'free' ? givenText : undefined, chosen_word_id: chosenWordId,
      });
      setGivenAnswer({ text: givenText, typed: mode === 'free' });
      setResult(response);
      refetchScore();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  }, [question, lessonId, refetchScore]);

  const continueToNext = useCallback(() => {
    setResult(null);
    if (reviewMode) setReviewIndex((i) => i + 1);
    else pickNext();
  }, [reviewMode, pickNext]);

  const reviewFinished = reviewMode && reviewIndex >= words.length;

  return {
    question, result, givenAnswer, submitting, error, reviewFinished, restart, submit, continueToNext,
    position: Math.min(reviewIndex + 1, words.length), total: words.length,
  };
}
