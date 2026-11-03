export const LESSON_SUB_TABS = ['lesson', 'vocabulary'] as const;
export type LessonSubTab = (typeof LESSON_SUB_TABS)[number];
export const LESSON_SUB_TAB_STORAGE_KEY = 'language.lessonSubTab';
export const LEARN_SUB_TAB_STORAGE_KEY = 'language.learnSubTab';
