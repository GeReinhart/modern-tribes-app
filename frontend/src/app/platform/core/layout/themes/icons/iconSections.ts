import { ICON_NAMES, IconName } from './iconTypes.ts';

export type IconSectionKey =
  | 'general'
  | 'tasks'
  | 'calendar'
  | 'documents'
  | 'media'
  | 'people'
  | 'groceries';

export interface IconSection {
  key: IconSectionKey;
  labelKey: string;
  icons: IconName[];
}

const TASKS_ICONS: IconName[] = [
  'check', 'archive', 'hash', 'list', 'flag', 'target',
  'clipboard', 'grid', 'layout', 'columns', 'check-square',
];

const CALENDAR_ICONS: IconName[] = ['bell', 'calendar', 'clock', 'alert-circle', 'watch'];

const DOCUMENTS_ICONS: IconName[] = [
  'save', 'file-text', 'folder', 'book', 'image',
  'printer', 'copy', 'database', 'server', 'cloud', 'file',
];

const MEDIA_ICONS: IconName[] = ['music', 'video', 'camera', 'headphones', 'mic', 'volume-2', 'disc'];

const PEOPLE_ICONS: IconName[] = [
  'user', 'heart', 'mail', 'users', 'message-circle',
  'share-2', 'thumbs-up', 'smile', 'briefcase', 'phone',
];

const GROCERIES_ICONS: IconName[] = [
  'apple', 'banana', 'orange', 'lemon', 'grape', 'strawberry', 'watermelon', 'cherry',
  'pineapple', 'avocado', 'carrot', 'pepper', 'onion', 'potato', 'mushroom', 'broccoli',
  'corn', 'pumpkin', 'bread', 'croissant', 'donut', 'cupcake', 'cookie', 'cake',
  'milk', 'cheese', 'butter', 'yogurt', 'egg', 'ice-cream',
  'meat', 'bacon', 'sausage', 'fish', 'shrimp',
  'bottle', 'wine-glass', 'jar', 'basket',
];

const THEMED_ICONS = new Set<IconName>([
  ...TASKS_ICONS,
  ...CALENDAR_ICONS,
  ...DOCUMENTS_ICONS,
  ...MEDIA_ICONS,
  ...PEOPLE_ICONS,
  ...GROCERIES_ICONS,
]);

const GENERAL_ICONS: IconName[] = ICON_NAMES.filter((name) => !THEMED_ICONS.has(name));

/**
 * Icons are all defined once under platform/core/layout/themes/icons/ and grouped here into
 * sections so IconSectionPicker can show only the relevant section open by default while still
 * letting the user pick from any other section. An icon may appear in more than one section.
 */
export const ICON_SECTIONS: IconSection[] = [
  { key: 'general', labelKey: 'iconPicker.section.general', icons: GENERAL_ICONS },
  { key: 'tasks', labelKey: 'iconPicker.section.tasks', icons: TASKS_ICONS },
  { key: 'calendar', labelKey: 'iconPicker.section.calendar', icons: CALENDAR_ICONS },
  { key: 'documents', labelKey: 'iconPicker.section.documents', icons: DOCUMENTS_ICONS },
  { key: 'media', labelKey: 'iconPicker.section.media', icons: MEDIA_ICONS },
  { key: 'people', labelKey: 'iconPicker.section.people', icons: PEOPLE_ICONS },
  { key: 'groceries', labelKey: 'iconPicker.section.groceries', icons: GROCERIES_ICONS },
];
