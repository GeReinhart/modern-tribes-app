import { initReactI18next } from 'react-i18next';

import i18n from 'i18next';

import en from './locales/en';
import fr from './locales/fr';

const defaultLanguage =
  (import.meta.env.VITE_DEFAULT_LANGUAGE as string) || 'en';
const savedLanguage = localStorage.getItem('user_language');

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
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
