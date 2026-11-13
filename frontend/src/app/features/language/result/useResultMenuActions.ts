import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';

import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { ResultsSubTab } from './resultsSubTabs.ts';
import { CompetitionParticipationState } from './useCompetitionParticipation.ts';

interface Options {
  subTab: ResultsSubTab;
  participation: CompetitionParticipationState;
  onBack: () => void;
}

// The page menu of one lesson's results: back to the lessons, and on the Competition sub-tab
// join or leave the competition.
export function useResultMenuActions({ subTab, participation, onBack }: Options): void {
  const { t } = useTranslation();
  const { participates, toggle } = participation;
  // Read through a ref so a new `onBack` function on each render does not re-register the menu.
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  const actions = useMemo(() => {
    const back = { id: 'language.result.backToLessons', icon: 'arrow-left' as const, label: t('features.language.backToLessons'), onClick: () => onBackRef.current() };
    if (subTab !== 'competition' || participates === null) return [back];
    const join = { id: 'language.result.toggleCompetition', icon: participates ? 'eye-off' as const : 'eye' as const, label: t(participates ? 'features.language.leaveCompetition' : 'features.language.joinCompetition'), onClick: toggle };
    return [back, join];
  }, [subTab, participates, toggle, t]);

  useRegisterTabActions(actions);
}
