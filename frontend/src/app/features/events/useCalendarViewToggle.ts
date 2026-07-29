import { MenuAction } from '@/app/platform/core/layout/menu.types.ts';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type CalendarViewMode = 'day' | 'week';

type TranslateFn = (key: string) => string;

function readStoredMode(storageKey: string): CalendarViewMode {
  return localStorage.getItem(storageKey) === 'week' ? 'week' : 'day';
}

// Tracks the day/week toggle for a planning view, persists the choice per
// storageKey (e.g. per feature instance), and hands back a ready-to-register
// MenuAction so the toggle shows up in both the tab's menu and its toolbar.
export function useCalendarViewToggle(storageKey: string, t: TranslateFn) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => readStoredMode(storageKey));

  useEffect(() => {
    localStorage.setItem(storageKey, viewMode);
  }, [storageKey, viewMode]);

  const toggleViewMode = useCallback(() => {
    setViewMode(prev => (prev === 'day' ? 'week' : 'day'));
  }, []);

  const toggleAction: MenuAction = useMemo(() => ({
    icon: 'columns', badgeIcon: 'calendar',
    label: viewMode === 'day' ? t('features.events.switchToWeekView') : t('features.events.switchToDayView'),
    onClick: toggleViewMode,
  }), [viewMode, toggleViewMode, t]);

  return { viewMode, toggleAction };
}
