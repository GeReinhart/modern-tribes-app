export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    danger: string;
    success: string;
    ghost: string;
    text: string;
    surface: string;
    border: string;
  };
}

export interface EntityTheme {
  entityId: string;
  entityType: string;
  theme: Theme;
}

// Predefined themes
export const predefinedThemes: Record<string, Theme> = {
  default: {
    id: 'default',
    name: 'default',
    colors: {
      primary: '#708090',
      secondary: '#4682B4',
      accent: '#FF7F50',
      danger: '#de1234',
      success: '#266ceb',
      ghost: '#a9c3da',
      text: '#565d64',
      surface: '#ffffff',
      border: '#708090',
    },
  },
  main_1: {
    id: 'main_1',
    name: 'main_1_grey',
    colors: {
      primary: '#708090',
      secondary: '#C0C0C0',
      accent: '#A9A9A9',
      danger: '#de1234',
      success: '#FF7F50',
      ghost: '#a9c3da',
      text: '#565d64',
      surface: '#fffefe',
      border: '#708090',
    },
  },
  main_2: {
    id: 'main_2',
    name: 'main_2_blue',
    colors: {
      primary: '#4682B4',
      secondary: '#4169E1',
      accent: '#6495ED',
      danger: '#de1234',
      success: '#FF7F50',
      ghost: '#a9c3da',
      text: '#375670',
      surface: '#d7dfe7',
      border: '#708090',
    },
  },
  main_3: {
    id: 'main_3',
    name: 'main_3_orange',
    colors: {
      primary: '#FF7F50',
      secondary: '#FF6347',
      accent: '#FFA500',
      danger: '#de1234',
      success: '#FF7F50',
      ghost: '#a9c3da',
      text: '#77422f',
      surface: '#fff6f2',
      border: '#708090',
    },
  },
  alt_01: {
    id: 'alt_01',
    name: 'alt_01_blue_purple',
    colors: {
      primary: '#1E90FF',
      secondary: '#7B68EE',
      accent: '#00BFFF',
      danger: '#de1234',
      success: '#FF7F50',
      ghost: '#a9c3da',
      text: '#114b82',
      surface: '#ffffff',
      border: '#708090',
    },
  },
  alt_02: {
    id: 'alt_02',
    name: 'alt_02_green',
    colors: {
      primary: '#3CB371',
      secondary: '#32CD32',
      accent: '#00FF7F',
      danger: '#de1234',
      success: '#FF7F50',
      ghost: '#a9c3da',
      text: '#153c26',
      surface: '#ffffff',
      border: '#708090',
    },
  },
  alt_03: {
    id: 'alt_03',
    name: 'alt_03_purple',
    colors: {
      primary: '#BA55D3',
      secondary: '#9370DB',
      accent: '#EE82EE',
      danger: '#de1234',
      success: '#FF7F50',
      ghost: '#4d5a64',
      text: '#401e49',
      surface: '#ffffff',
      border: '#708090',
    },
  },
  alt_04: {
    id: 'alt_04',
    name: 'alt_04_neon',
    colors: {
      primary: '#00FFFF',
      secondary: '#FF00FF',
      accent: '#00FF00',
      danger: '#de1234',
      success: '#FF7F50',
      ghost: '#a9c3da',
      text: '#1b5757',
      surface: '#ffffff',
      border: '#708090',
    },
  },
  alt_05: {
    id: 'alt_05',
    name: 'alt_05_autumn',
    colors: {
      primary: '#FF8C00',
      secondary: '#DAA520',
      accent: '#F4A460',
      danger: '#de1234',
      success: '#FF7F50',
      ghost: '#a9c3da',
      text: '#462701',
      surface: '#ffffff',
      border: '#708090',
    },
  },
  alt_06: {
    id: 'alt_06',
    name: 'alt_06_pale_green',
    colors: {
      primary: '#66CDAA',
      secondary: '#40E0D0',
      accent: '#AFEEEE',
      danger: '#de1234',
      success: '#FF7F50',
      ghost: '#a9c3da',
      text: '#244a3d',
      surface: '#ffffff',
      border: '#708090',
    },
  },
  alt_07: {
    id: 'alt_07',
    name: 'alt_07_pink',
    colors: {
      primary: '#FF69B4',
      secondary: '#DA70D6',
      accent: '#FF1493',
      danger: '#de1234',
      success: '#FF7F50',
      ghost: '#a9c3da',
      text: '#56233d',
      surface: '#ffffff',
      border: '#708090',
    },
  },
};

export const themeKeys = Object.keys(predefinedThemes);

export const LABEL_COLORS: string[] = [
  predefinedThemes.default.colors.danger, // red
  predefinedThemes.main_3.colors.primary, // coral
  predefinedThemes.alt_05.colors.primary, // dark orange
  predefinedThemes.main_3.colors.accent, // orange
  predefinedThemes.alt_05.colors.secondary, // gold
  predefinedThemes.alt_02.colors.primary, // sea green
  predefinedThemes.alt_06.colors.primary, // aquamarine
  predefinedThemes.alt_06.colors.secondary, // turquoise
  predefinedThemes.main_2.colors.primary, // steel blue
  predefinedThemes.alt_01.colors.primary, // dodger blue
  predefinedThemes.alt_04.colors.secondary, // magenta
  predefinedThemes.alt_03.colors.primary, // orchid purple
  predefinedThemes.alt_03.colors.accent, // violet
  predefinedThemes.alt_07.colors.primary, // hot pink
  predefinedThemes.default.colors.primary, // slate grey
];

export const URGENCY_COLORS: string[] = [
  predefinedThemes.alt_06.colors.primary, // #66CDAA aquamarine — very comfortable
  predefinedThemes.alt_02.colors.primary, // #3CB371 sea green  — comfortable
  predefinedThemes.alt_05.colors.secondary, // #DAA520 goldenrod  — moderate
  predefinedThemes.main_3.colors.primary, // #FF7F50 coral      — urgent
  predefinedThemes.default.colors.danger, // #de1234 red        — overdue / critical
];

export const FIB_COLORS: string[] = [
  predefinedThemes.alt_02.colors.primary, // sea green   — size 1
  predefinedThemes.alt_06.colors.primary, // aquamarine  — size 2
  predefinedThemes.alt_06.colors.secondary, // turquoise   — size 3
  predefinedThemes.main_2.colors.primary, // steel blue  — size 5
  predefinedThemes.alt_03.colors.secondary, // medium purple — size 8
  predefinedThemes.alt_05.colors.primary, // dark orange — size 13
  predefinedThemes.default.colors.danger, // red         — size 21
];

export const themesById = Object.values(predefinedThemes).reduce(
  (acc, theme) => {
    acc[theme.id] = theme;
    return acc;
  },
  {} as Record<string, Theme>,
);
