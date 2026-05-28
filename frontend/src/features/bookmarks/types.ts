export interface UserBookmark {
  id: string;
  page_path: string;
  page_title: string;
  display_order: number;
  description: string | null;
  color_text: string | null;
  color_background: string | null;
}

export interface UserBookmarkUpdate {
  page_title: string;
  description: string | null;
  color_text: string | null;
  color_background: string | null;
}

export interface BookmarkColorPreset {
  id: string;
  label: string;
  background: string;
  text: string;
}

export interface UserBookmarksResponse {
  bookmarks: UserBookmark[];
}

export const BOOKMARK_COLOR_PRESETS: BookmarkColorPreset[] = [
  // Greys — default / main_1
  { id: 'slate', label: 'Slate', background: '#f0f2f4', text: '#708090' },
  { id: 'silver', label: 'Silver', background: '#f4f4f5', text: '#565d64' },
  // Blues — default secondary, main_2, alt_01
  { id: 'steel', label: 'Steel Blue', background: '#dceefb', text: '#375670' },
  { id: 'royal', label: 'Royal Blue', background: '#d6dcff', text: '#2a3e8a' },
  {
    id: 'cornflower',
    label: 'Cornflower',
    background: '#dce9ff',
    text: '#2a4e8c',
  },
  {
    id: 'dodger',
    label: 'Dodger Blue',
    background: '#d0e8ff',
    text: '#114b82',
  },
  // Purples — alt_01 secondary, alt_03
  {
    id: 'periwinkle',
    label: 'Periwinkle',
    background: '#e4e0ff',
    text: '#3e2d9c',
  },
  { id: 'orchid', label: 'Orchid', background: '#f0d9f8', text: '#401e49' },
  { id: 'mauve', label: 'Mauve', background: '#e8e2ff', text: '#3d1e70' },
  { id: 'violet', label: 'Violet', background: '#f8dcf8', text: '#4a1a4a' },
  // Greens — alt_02, alt_06
  { id: 'emerald', label: 'Emerald', background: '#d5ede0', text: '#153c26' },
  { id: 'lime', label: 'Lime', background: '#d8f8d8', text: '#1a5a1a' },
  {
    id: 'aquamarine',
    label: 'Aquamarine',
    background: '#d0f4e8',
    text: '#244a3d',
  },
  {
    id: 'turquoise',
    label: 'Turquoise',
    background: '#d0f4f2',
    text: '#174038',
  },
  // Oranges & reds — default accent, main_3, alt_05
  { id: 'coral', label: 'Coral', background: '#fde8de', text: '#77422f' },
  { id: 'tomato', label: 'Tomato', background: '#ffddd5', text: '#7a2a1a' },
  { id: 'amber', label: 'Amber', background: '#fff3cc', text: '#7a5200' },
  { id: 'autumn', label: 'Autumn', background: '#fce8cb', text: '#462701' },
  {
    id: 'goldenrod',
    label: 'Goldenrod',
    background: '#fef3d5',
    text: '#7a5200',
  },
  // Pinks — alt_07
  { id: 'pink', label: 'Pink', background: '#fce0ef', text: '#56233d' },
];

export const DEFAULT_BOOKMARK_COLOR = BOOKMARK_COLOR_PRESETS[0];
