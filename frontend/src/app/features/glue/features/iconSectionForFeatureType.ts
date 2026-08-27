import { IconSectionKey } from '@/app/platform/core/layout/themes/icons/iconSections.ts';

const FEATURE_TYPE_ICON_SECTION: Record<string, IconSectionKey> = {
  kanban: 'tasks',
  todo_list: 'tasks',
  events: 'calendar',
  guitar_song: 'media',
  guitar_tuner: 'media',
  guitar_metronome: 'media',
  guitar_chords: 'media',
  guitar_notes: 'media',
  groceries: 'groceries',
  recipes: 'groceries',
  meals: 'groceries',
  daily_journal: 'documents',
};

export function iconSectionForFeatureType(featureType: string | undefined | null): IconSectionKey {
  return (featureType && FEATURE_TYPE_ICON_SECTION[featureType]) || 'general';
}
