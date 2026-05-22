import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedTabs } from '@/components/common/layout/ThemedTabs';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { themesById } from '@/components/themes/themes';
import DashboardTasksTab from '@/dashboard/tabs/DashboardTasksTab';
import DashboardTribesTab from '@/dashboard/tabs/DashboardTribesTab';

const TABS = (t: (k: string) => string) => [
    { key: 'tasks', label: t('dashboard.tabs.tasks'), Component: DashboardTasksTab },
    { key: 'tribes', label: t('dashboard.tabs.tribes'), Component: DashboardTribesTab },
];

const DashboardPageContent: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { tab } = useParams<{ tab?: string }>();

    const tabs = useMemo(() => TABS(t), [t]);
    const activeTab = tab && tabs.find(tb => tb.key === tab) ? tab : tabs[0].key;
    const ActiveComponent = tabs.find(tb => tb.key === activeTab)?.Component ?? DashboardTasksTab;

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('dashboard.title') },
    ], [t]);

    const breadcrumbTabs = useMemo(() => tabs.map(tb => ({
        key: tb.key,
        label: tb.label,
        path: `/app/dashboard/${tb.key}`,
        isActive: tb.key === activeTab,
    })), [tabs, activeTab]);

    const handleTabChange = (key: string) => navigate(`/app/dashboard/${key}`);

    const headerActions = (
        <ThemedButton
            requiredPermissions={['admin']}
            variant="ghost"
            onClick={() => navigate('/admin')}
            theme={themesById['main_3']}
        >
            {t('common.admin')}
        </ThemedButton>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} breadcrumbTabs={breadcrumbTabs} headerActions={headerActions}>
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
