import { BreadcrumbTab } from '@/app/platform/core/layout/Breadcrumb.tsx';

import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export interface TabDefinition {
  key: string;
  label: string;
  color?: string;
}

export interface NavTab extends TabDefinition {
  href: string;
}

interface UseUrlTabResult {
  activeTab: string;
  handleTabChange: (key: string) => void;
  breadcrumbTabs: BreadcrumbTab[];
  navTabs: NavTab[];
}

export function useUrlTab(
  tabs: TabDefinition[],
  basePath: string,
  defaultTabKey?: string,
  tabsReady?: boolean,
): UseUrlTabResult {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();

  const activeTab = tab || defaultTabKey || tabs[0]?.key || '';

  useEffect(() => {
    if (!tab || tabs.length === 0 || !defaultTabKey) return;
    if (tabsReady === false) return;
    if (!tabs.some((t) => t.key === tab)) {
      navigate(`${basePath}/${defaultTabKey}`, { replace: true });
    }
  }, [tab, tabs, defaultTabKey, basePath, navigate, tabsReady]);

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

  const navTabs = useMemo(
    () => tabs.map((t) => ({ ...t, href: `${basePath}/${t.key}` })),
    [tabs, basePath],
  );

  const handleTabChange = (key: string) => navigate(`${basePath}/${key}`);

  return { activeTab, breadcrumbTabs, handleTabChange, navTabs };
}
