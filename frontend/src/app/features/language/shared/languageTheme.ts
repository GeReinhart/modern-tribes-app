import { Language } from './types.ts';

// A language with no theme configured (or not found yet, while `useLanguages()` is still
// loading) resolves to `undefined`, which `ThemedSection` already treats as "use the ambient
// theme" -- see frontend/src/app/platform/core/layout/themes/components/ThemedSection.tsx.
export function themeCodeForLanguage(languages: Language[], code: string): string | undefined {
  return languages.find((l) => l.code === code)?.theme_code ?? undefined;
}
