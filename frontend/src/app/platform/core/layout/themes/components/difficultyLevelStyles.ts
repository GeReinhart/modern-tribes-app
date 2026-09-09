import { LevelOption } from './ThemedLevelPicker.tsx';
import { IconName } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

// Icon+color only -- captions are resolved by each caller via i18n, since the same 0-5 scale
// reads differently depending on what it rates (a guitar song, a chord, a recipe...). Shared at
// the platform level so any feature needing a difficulty-style 0-5 rating reuses one gradient
// instead of redefining its own colors.
export const DIFFICULTY_LEVEL_STYLES: (Omit<LevelOption, 'caption'> & { icon: IconName })[] = [
  { value: 0, icon: 'zap', color: '#22c55e' },
  { value: 1, icon: 'zap', color: '#84cc16' },
  { value: 2, icon: 'zap', color: '#eab308' },
  { value: 3, icon: 'zap', color: '#f97316' },
  { value: 4, icon: 'zap', color: '#ef4444' },
  { value: 5, icon: 'zap', color: '#b91c1c' },
];
