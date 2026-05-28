import { TabDefinition } from '@/hooks/useUrlTab';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { tabConfigService } from './tabConfig.service';
import { TabConfigItem, TabWithConfig } from './types';

interface UseTabConfigResult {
  visibleTabs: TabDefinition[];
  defaultTabKey: string;
  tabsWithConfig: TabWithConfig[];
  saveConfig: (updated: TabWithConfig[]) => Promise<void>;
  isLoading: boolean;
}

function mergeWithSaved(
  allTabs: TabDefinition[],
  saved: TabConfigItem[],
): TabWithConfig[] {
  const savedMap = new Map(saved.map((s) => [s.key, s]));
  const merged: TabWithConfig[] = allTabs.map((tab, index) => {
    const s = savedMap.get(tab.key);
    return {
      key: tab.key,
      label: tab.label,
      visible: s ? s.visible : true,
      order: s ? s.order : index,
      is_default: s ? s.is_default : false,
    };
  });
  merged.sort((a, b) => a.order - b.order);
  const hasDefault = merged.some((t) => t.is_default && t.visible);
  if (!hasDefault) {
    const first = merged.find((t) => t.visible);
    if (first) first.is_default = true;
  }
  return merged;
}

export function useTabConfig(
  contextKey: string,
  allTabs: TabDefinition[],
): UseTabConfigResult {
  const [savedConfigs, setSavedConfigs] = useState<TabConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!contextKey) return;
    let cancelled = false;
    setIsLoading(true);
    tabConfigService
      .get(contextKey)
      .then((resp) => {
        if (!cancelled) setSavedConfigs(resp.tab_configs);
      })
      .catch(() => {
        if (!cancelled) setSavedConfigs([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contextKey]);

  const tabsWithConfig = useMemo(
    () => mergeWithSaved(allTabs, savedConfigs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allTabs.map((t) => t.key).join(','), savedConfigs],
  );

  const visibleTabs = useMemo(
    () =>
      tabsWithConfig
        .filter((t) => t.visible)
        .map(({ key, label }) => ({ key, label })),
    [tabsWithConfig],
  );

  const defaultTabKey = useMemo(
    () =>
      tabsWithConfig.find((t) => t.is_default && t.visible)?.key ??
      visibleTabs[0]?.key ??
      '',
    [tabsWithConfig, visibleTabs],
  );

  const saveConfig = useCallback(
    async (updated: TabWithConfig[]) => {
      const saved = await tabConfigService.save(contextKey, updated);
      setSavedConfigs(saved.tab_configs);
    },
    [contextKey],
  );

  return { visibleTabs, defaultTabKey, tabsWithConfig, saveConfig, isLoading };
}
