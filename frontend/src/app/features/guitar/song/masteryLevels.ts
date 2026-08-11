import { LevelOption } from '@/app/platform/core/layout/themes/components/ThemedLevelPicker.tsx';
import { IconName } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

// Icon+color only -- captions are resolved by callers via guitarSong.mastery.level0..5.
export const MASTERY_LEVEL_STYLES: (Omit<LevelOption, 'caption'> & { icon: IconName })[] = [
  { value: 0, icon: 'star', color: '#9ca3af' },
  { value: 1, icon: 'star', color: '#f97316' },
  { value: 2, icon: 'star', color: '#eab308' },
  { value: 3, icon: 'star', color: '#84cc16' },
  { value: 4, icon: 'star', color: '#22c55e' },
  { value: 5, icon: 'star', color: '#16a34a' },
];
