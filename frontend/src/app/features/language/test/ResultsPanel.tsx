import { useAuth } from '@/app/platform/core/authentication/AuthContext.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import ScoreChart from './ScoreChart.tsx';
import ScoreExplanation from './ScoreExplanation.tsx';
import { useLessonScore } from './useLessonScore.ts';
import { useScoreHistory } from './useScoreHistory.ts';
import { useTestMembers } from './useTestMembers.ts';
import WordResultCard from './WordResultCard.tsx';
import { Language, Word } from '../shared/types.ts';

interface Props {
  lessonId: string;
  words: Word[];
  languages: Language[];
}

const formatOverall = (score: number) => `${(score * 100).toFixed(2)}%`;

// The "Result" sub-tab: a person selector (the signed-in user by default), the big overall
// score, then one card per word with its own score and answer history.
const ResultsPanel: React.FC<Props> = ({ lessonId, words, languages }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const members = useTestMembers(lessonId);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const effectiveUserId = selectedUserId ?? user?.id;
  const { scoreData } = useLessonScore(lessonId, selectedUserId);
  const history = useScoreHistory(lessonId, selectedUserId);
  const scoreByWordId = new Map((scoreData?.words ?? []).map((s) => [s.word_id, s]));
  const options = members.map((m) => ({ value: m.user_id, label: m.name }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {options.length > 0 && (
        <ThemedSelect
          label={t('features.language.resultsPerson')}
          options={options}
          value={effectiveUserId}
          allowEmpty={false}
          onChange={(userId) => setSelectedUserId(userId === user?.id ? undefined : userId)}
        />
      )}
      <div style={{ textAlign: 'center', fontSize: '3rem', fontWeight: 700, color: theme.colors.primary }}>
        {formatOverall(scoreData?.overall_score ?? 0)}
      </div>
      <ScoreChart points={history} />
      <ScoreExplanation />
      {words.length === 0 && <ThemedText variant="secondary" size="small">{t('features.language.noWords')}</ThemedText>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {words.map((word) => (
          <WordResultCard key={word.id} word={word} languages={languages} score={scoreByWordId.get(word.id)} />
        ))}
      </div>
    </div>
  );
};

export default ResultsPanel;
