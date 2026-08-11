import { LevelOption } from '@/app/platform/core/layout/themes/components/ThemedLevelPicker.tsx';
import { IconName } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

// Icon+color only -- captions are resolved by each caller via i18n (see
// guitarSong.difficulty.level0..5 / guitarChord.difficulty.level0..5), since the same 0-5 scale
// reads differently for a song ("très facile"..."très difficile") and a chord ("facile"...).
// Shared here (not under song/) because chords is the lower feature layer: song already depends
// on chords, never the other way around.
export const DIFFICULTY_LEVEL_STYLES: (Omit<LevelOption, 'caption'> & { icon: IconName })[] = [
  { value: 0, icon: 'zap', color: '#22c55e' },
  { value: 1, icon: 'zap', color: '#84cc16' },
  { value: 2, icon: 'zap', color: '#eab308' },
  { value: 3, icon: 'zap', color: '#f97316' },
  { value: 4, icon: 'zap', color: '#ef4444' },
  { value: 5, icon: 'zap', color: '#b91c1c' },
];
