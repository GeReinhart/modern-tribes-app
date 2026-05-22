import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedTabs } from '@/components/common/layout/ThemedTabs';
import DashboardTasksTab from '@/dashboard/tabs/DashboardTasksTab';

const TABS = (t: (k: string) => string) => [
    { key: 'tasks', label: t('dashboard.tabs.tasks'), Component: DashboardTasksTab },
];

const DashboardPageContent: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { tab } = useParams<{ tab?: string }>();

    const tabs = useMemo(() => TABS(t), [t]);
    const activeTab = tab && tabs.find(tb => tb.key === tab) ? tab : tabs[0].key;
    const ActiveComponent = tabs.find(tb => tb.key === activeTab)?.Component ?? DashboardTasksTab;

    const breadcrumbs = useMemo(() => [
        { label: t('dashboard.title') },
    ], [t]);

    const breadcrumbTabs = useMemo(() => tabs.map(tb => ({
        key: tb.key,
        label: tb.label,
        path: `/app/dashboard/${tb.key}`,
        isActive: tb.key === activeTab,
    })), [tabs, activeTab]);

    const handleTabChange = (key: string) => navigate(`/app/dashboard/${key}`);

    return (
        <AppLayout breadcrumbs={breadcrumbs} breadcrumbTabs={breadcrumbTabs}>
            <ThemedTabs
                tabs={tabs.map(({ key, label }) => ({ key, label }))}
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />
            <ActiveComponent />
        </AppLayout>
    );
};

const DashboardPage: React.FC = () => (
    <ThemeProvider defaultTheme="default"><DashboardPageContent /></ThemeProvider>
);

export default DashboardPage;
