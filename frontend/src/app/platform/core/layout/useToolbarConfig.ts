import { ToolbarActionPlacement, ToolbarConfigOverrides } from './toolbarConfig.types.ts';

import { useCallback, useEffect, useState } from 'react';

const storageKey = (tabTypeKey: string) => `toolbar-config:${tabTypeKey}`;

function loadOverrides(tabTypeKey: string | null): ToolbarConfigOverrides {
  if (!tabTypeKey) return {};
  const stored = localStorage.getItem(storageKey(tabTypeKey));
  if (!stored) return {};
  try {
    return JSON.parse(stored) as ToolbarConfigOverrides;
  } catch {
    return {};
  }
}

// Persists, per tab/page type, which toolbar actions the user pinned directly on the toolbar
// vs pushed into the overflow menu — overriding the automatic "collapse page actions past 4" rule.
export function useToolbarConfig(tabTypeKey: string | null) {
  const [overrides, setOverrides] = useState<ToolbarConfigOverrides>(() => loadOverrides(tabTypeKey));

  useEffect(() => {
    setOverrides(loadOverrides(tabTypeKey));
  }, [tabTypeKey]);

  const setPlacement = useCallback((actionId: string, placement: ToolbarActionPlacement) => {
    if (!tabTypeKey) return;
    setOverrides((previous) => {
      const next = { ...previous, [actionId]: placement };
      localStorage.setItem(storageKey(tabTypeKey), JSON.stringify(next));
      return next;
    });
  }, [tabTypeKey]);

  return { overrides, setPlacement };
}
