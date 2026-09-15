import { ToolbarActionPlacement, ToolbarConfigOverrides } from './toolbarConfig.types.ts';

import { useCallback, useEffect, useState } from 'react';

const storageKey = (toolbarKey: string) => `toolbar-config:${toolbarKey}`;

function loadOverrides(toolbarKey: string): ToolbarConfigOverrides {
  const stored = localStorage.getItem(storageKey(toolbarKey));
  if (!stored) return {};
  try {
    return JSON.parse(stored) as ToolbarConfigOverrides;
  } catch {
    return {};
  }
}

// Persists, per tab type or standalone page, which toolbar actions the user pinned directly on
// the toolbar vs pushed into the overflow menu — overriding the automatic "collapse page actions
// past 4" rule.
export function useToolbarConfig(toolbarKey: string) {
  const [overrides, setOverrides] = useState<ToolbarConfigOverrides>(() => loadOverrides(toolbarKey));

  useEffect(() => {
    setOverrides(loadOverrides(toolbarKey));
  }, [toolbarKey]);

  const setPlacement = useCallback((actionId: string, placement: ToolbarActionPlacement) => {
    setOverrides((previous) => {
      const next = { ...previous, [actionId]: placement };
      localStorage.setItem(storageKey(toolbarKey), JSON.stringify(next));
      return next;
    });
  }, [toolbarKey]);

  return { overrides, setPlacement };
}
