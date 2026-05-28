import { BreadcrumbTab } from '@/platform/layout/Breadcrumb';

import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export interface TabDefinition {
  key: string;
  label: string;
}

interface UseUrlTabResult {
  activeTab: string;
  handleTabChange: (key: string) => void;
  breadcrumbTabs: BreadcrumbTab[];
}

export function useUrlTab(
  tabs: TabDefinition[],
  basePath: string,
  defaultTabKey?: string,
): UseUrlTabResult {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const activeTab = tab || defaultTabKey || tabs[0]?.key || '';

  useEffect(() => {
    if (!tab || tabs.length === 0 || !defaultTabKey) return;
    if (!tabs.some((t) => t.key === tab)) {
      navigate(`${basePath}/${defaultTabKey}`, { replace: true });
    }
  }, [tab, tabs, defaultTabKey, basePath, navigate]);

  const breadcrumbTabs = useMemo(
    () =>
      tabs.map((t) => ({
        key: t.key,
        label: t.label,
        path: `${basePath}/${t.key}`,
        isActive: t.key === activeTab,
      })),
    [tabs, basePath, activeTab],
  );

  const handleTabChange = (key: string) => navigate(`${basePath}/${key}`);

  return { activeTab, breadcrumbTabs, handleTabChange };
}
