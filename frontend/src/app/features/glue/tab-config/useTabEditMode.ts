import { useMemo, useState } from 'react';

import { TabWithConfig } from './types.ts';

export interface HiddenTab {
  key: string;
  label: string;
  color?: string;
  icon?: string | null;
}

interface UseTabEditModeResult {
  tabEditMode: boolean;
  editingTabKey: string | null;
  setEditingTabKey: (key: string | null) => void;
  hiddenTabs: HiddenTab[];
  toggleTabEditMode: () => void;
}

export function useTabEditMode(tabsWithConfig: TabWithConfig[]): UseTabEditModeResult {
  const [tabEditMode, setTabEditMode] = useState(false);
  const [editingTabKey, setEditingTabKey] = useState<string | null>(null);

  const hiddenTabs = useMemo(
    () =>
      tabsWithConfig
        .filter((tab) => !tab.visible)
        .map(({ key, label, color, icon, name }) => ({
          key,
          label: name != null ? name : label,
          color,
          icon,
        })),
    [tabsWithConfig],
  );

  const toggleTabEditMode = () => {
    setTabEditMode((v) => !v);
    setEditingTabKey(null);
  };

  return { tabEditMode, editingTabKey, setEditingTabKey, hiddenTabs, toggleTabEditMode };
}
