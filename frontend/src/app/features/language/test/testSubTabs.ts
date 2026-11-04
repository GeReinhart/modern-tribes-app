export const TEST_SUB_TABS = ['full_forward', 'full_backward', 'random', 'articles', 'plurals'] as const;
export type TestSubTab = (typeof TEST_SUB_TABS)[number];
export const TEST_SUB_TAB_STORAGE_KEY = 'language.testSubTab';
