// Languages that have a character missing from a regular keyboard, with a button to type it.
export const SPECIAL_CHARACTER_BY_LANGUAGE: Record<string, string> = { de: 'ß' };

export const hasSpecialCharacter = (language?: string): boolean =>
  Boolean(language && SPECIAL_CHARACTER_BY_LANGUAGE[language]);
