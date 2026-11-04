import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { useMemberScore } from './useMemberScore.ts';
import WordResultCard from './WordResultCard.tsx';
import { Language, Word } from '../shared/types.ts';

interface Props {
  lessonId: string;
  words: Word[];
  languages: Language[];
  userId?: string;
}

// The "By word" results: one card per word with its own score and answer history.
const WordResultsPanel: React.FC<Props> = ({ lessonId, words, languages, userId }) => {
  const { t } = useTranslation();
  const scoreData = useMemberScore(lessonId, userId);
  const scoreByWordId = new Map((scoreData?.words ?? []).map((s) => [s.word_id, s]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {words.length === 0 && <ThemedText variant="secondary" size="small">{t('features.language.noWords')}</ThemedText>}
      {words.map((word) => (
        <WordResultCard key={word.id} word={word} languages={languages} score={scoreByWordId.get(word.id)} />
      ))}
    </div>
  );
};

export default WordResultsPanel;
