import { initReactI18next } from 'react-i18next';

import i18n from 'i18next';

import eventsEn from '@/app/features/events/locales/en.ts';
import eventsFr from '@/app/features/events/locales/fr.ts';
import bookmarksEn from '@/app/features/bookmarks/locales/en.ts';
import bookmarksFr from '@/app/features/bookmarks/locales/fr.ts';
import glueEn from '@/app/features/glue/locales/en.ts';
import glueFr from '@/app/features/glue/locales/fr.ts';
import guitarNotesEn from '@/app/features/guitar/notes/locales/en.ts';
import guitarNotesFr from '@/app/features/guitar/notes/locales/fr.ts';
import guitarTunerEn from '@/app/features/guitar/tuner/locales/en.ts';
import guitarTunerFr from '@/app/features/guitar/tuner/locales/fr.ts';
import guitarMetronomeEn from '@/app/features/guitar/metronome/locales/en.ts';
import guitarMetronomeFr from '@/app/features/guitar/metronome/locales/fr.ts';
import guitarChordsEn from '@/app/features/guitar/chords/locales/en.ts';
import guitarChordsFr from '@/app/features/guitar/chords/locales/fr.ts';
import guitarSongEn from '@/app/features/guitar/song/locales/en.ts';
import guitarSongFr from '@/app/features/guitar/song/locales/fr.ts';
import dailyJournalEn from '@/app/features/daily-journal/locales/en.ts';
import dailyJournalFr from '@/app/features/daily-journal/locales/fr.ts';
import tasksEn from '@/app/features/tasks/locales/en.ts';
import tasksFr from '@/app/features/tasks/locales/fr.ts';
import groceriesEn from '@/app/features/groceries/locales/en.ts';
import groceriesFr from '@/app/features/groceries/locales/fr.ts';
import tribesProjectsEn from '@/app/features/tribes-projects/locales/en.ts';
import tribesProjectsFr from '@/app/features/tribes-projects/locales/fr.ts';
import recipesEn from '@/app/features/recipes/locales/en.ts';
import recipesFr from '@/app/features/recipes/locales/fr.ts';
import mealsEn from '@/app/features/meals/locales/en.ts';
import mealsFr from '@/app/features/meals/locales/fr.ts';
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
        ...eventsEn,
        ...bookmarksEn,
        ...tasksEn,
        ...groceriesEn,
        ...glueEn,
        ...tribesProjectsEn,
        ...guitarNotesEn,
        ...guitarTunerEn,
        ...guitarMetronomeEn,
        ...guitarChordsEn,
        ...guitarSongEn,
        ...dailyJournalEn,
        ...recipesEn,
        ...mealsEn,
      },
    },
    fr: {
      translation: {
        ...fr,
        ...eventsFr,
        ...bookmarksFr,
        ...tasksFr,
        ...groceriesFr,
        ...glueFr,
        ...tribesProjectsFr,
        ...guitarNotesFr,
        ...guitarTunerFr,
        ...guitarMetronomeFr,
        ...guitarChordsFr,
        ...guitarSongFr,
        ...dailyJournalFr,
        ...recipesFr,
        ...mealsFr,
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
