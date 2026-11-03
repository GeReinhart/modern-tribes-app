import { registerFeature } from '../../glue/registry.ts';
import LessonTab from './LessonTab.tsx';

registerFeature({
  feature_type: 'language_lesson',
  label: 'Language - Lesson',
  component: LessonTab,
});
