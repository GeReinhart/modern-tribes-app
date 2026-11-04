export const RESULTS_SUB_TABS = ['words', 'global', 'effort', 'competition'] as const;
export type ResultsSubTab = (typeof RESULTS_SUB_TABS)[number];
export const RESULTS_SUB_TAB_STORAGE_KEY = 'language.resultsSubTab';
