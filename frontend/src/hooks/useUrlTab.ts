import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BreadcrumbTab } from '@/components/layout/Breadcrumb';

export interface TabDefinition {
    key: string;
    label: string;
}

interface UseUrlTabResult {
    activeTab: string;
    handleTabChange: (key: string) => void;
    breadcrumbTabs: BreadcrumbTab[];
}

export function useUrlTab(tabs: TabDefinition[], basePath: string, defaultTabKey?: string): UseUrlTabResult {
    const { tab } = useParams<{ tab?: string }>();
    const navigate = useNavigate();

    const activeTab = tab || defaultTabKey || tabs[0]?.key || '';

    const breadcrumbTabs = useMemo(
        () => tabs.map(t => ({
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
