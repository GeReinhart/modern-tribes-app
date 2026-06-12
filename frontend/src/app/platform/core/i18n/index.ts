import { initReactI18next } from 'react-i18next';

import i18n from 'i18next';

import bookmarksEn from '@/app/features/bookmarks/locales/en.ts';
import bookmarksFr from '@/app/features/bookmarks/locales/fr.ts';
import glueEn from '@/app/features/glue/locales/en.ts';
import glueFr from '@/app/features/glue/locales/fr.ts';
import tasksEn from '@/app/features/tasks/locales/en.ts';
import tasksFr from '@/app/features/tasks/locales/fr.ts';
import tribesProjectsEn from '@/app/features/tribes-projects/locales/en.ts';
import tribesProjectsFr from '@/app/features/tribes-projects/locales/fr.ts';
import en from './locales/en.ts';
import fr from './locales/fr.ts';

const defaultLanguage =
  (import.meta.env.VITE_DEFAULT_LANGUAGE as string) || 'en';
const savedLanguage = localStorage.getItem('user_language');

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        ...en,
        ...bookmarksEn,
        ...tasksEn,
        ...glueEn,
        ...tribesProjectsEn,
      },
    },
    fr: {
      translation: {
        ...fr,
        ...bookmarksFr,
        ...tasksFr,
        ...glueFr,
        ...tribesProjectsFr,
      },
    },
  },
  lng: savedLanguage || defaultLanguage,
  fallbackLng: 'en',
  initAsync: false,
  keySeparator: false,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
