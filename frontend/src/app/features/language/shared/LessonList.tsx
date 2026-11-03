import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Lesson } from './types.ts';

interface Props {
  lessons: Lesson[];
  onOpen: (lessonId: string) => void;
  // Lets the test tab append a per-lesson score next to the word count, without the lesson
  // and learn tabs (which have nothing extra to show) needing a variant of this component.
  renderTrailing?: (lesson: Lesson) => React.ReactNode;
}

// The project's lesson list, identical across the lesson (write), learn (read) and test (quiz)
// tabs -- they all draw from the same lessons, so the list markup lives here once.
const LessonList: React.FC<Props> = ({ lessons, onOpen, renderTrailing }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  if (lessons.length === 0) {
    return (
      <ThemedText variant="secondary" size="small">{t('features.language.noLessons')}</ThemedText>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
      {lessons.map((lesson) => (
        <ThemedCard key={lesson.id} compact onClick={() => onOpen(lesson.id)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 600, color: theme.colors.text }}>{lesson.title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
                {t('features.language.wordCount', { count: lesson.word_count })}
              </span>
              {renderTrailing?.(lesson)}
            </div>
          </div>
        </ThemedCard>
      ))}
    </div>
  );
};

export default LessonList;
