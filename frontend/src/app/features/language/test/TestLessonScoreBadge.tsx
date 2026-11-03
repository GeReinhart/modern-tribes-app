import { ThemedBadge } from '@/app/platform/core/layout/themes/components/ThemedBadge.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { useLessonScore } from './useLessonScore.ts';

interface Props {
  lessonId: string;
}

// One row's score, fetched independently so the lesson list itself never waits on every
// lesson's score to come back before it can render.
const TestLessonScoreBadge: React.FC<Props> = ({ lessonId }) => {
  const { t } = useTranslation();
  const { scoreData, loading } = useLessonScore(lessonId);

  if (loading) return <ThemedLoadingSpinner size="sm" />;
  if (!scoreData) return null;

  return (
    <ThemedBadge variant="primary">
      {t('features.language.overallScorePercent', { percent: Math.round(scoreData.overall_score * 100) })}
    </ThemedBadge>
  );
};

export default TestLessonScoreBadge;
