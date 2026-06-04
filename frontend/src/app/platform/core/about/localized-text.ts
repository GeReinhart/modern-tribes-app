import { useTranslation } from 'react-i18next';

export interface LocalizedText {
  en: string[];
  fr: string[];
}

type SupportedLang = keyof LocalizedText;

function isSupportedLang(lang: string): lang is SupportedLang {
  return lang === 'en' || lang === 'fr';
}

export function useLocalizedText(): (text: LocalizedText) => string {
  const { i18n } = useTranslation();
  const base = i18n.language.split('-')[0];
  const lang: SupportedLang = isSupportedLang(base) ? base : 'en';
  return (text: LocalizedText) => (text[lang] ?? text.en).join('\n');
}
