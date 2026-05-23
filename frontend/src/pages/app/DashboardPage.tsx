import React, {useEffect, useMemo} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedTabs } from '@/components/common/layout/ThemedTabs';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { themesById } from '@/components/themes/themes';
import {useVerifyAuthorization} from "@/hooks/userVerifyAuthorization.ts";
import DashboardTasksTab from '@/features/dashboard/tabs/DashboardTasksTab';
import DashboardTribesTab from '@/features/dashboard/tabs/DashboardTribesTab';
import {ThemedCard} from "@/components/common/layout/ThemedCard.tsx";
import {errorStyle} from "@/styles/theme.styles.tsx";
import { useUrlTab } from '@/hooks/useUrlTab';

const TABS = (t: (k: string) => string) => [
    { key: 'tasks', label: t('dashboard.tabs.tasks'), Component: DashboardTasksTab },
    { key: 'tribes', label: t('dashboard.tabs.tribes'), Component: DashboardTribesTab },
];

const DashboardPageContent: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: authorization, error: authorizationError, verifyAuthorization } = useVerifyAuthorization();

    const tabs = useMemo(() => TABS(t), [t]);
    const { activeTab, breadcrumbTabs, handleTabChange } = useUrlTab(tabs, '/app/dashboard');
    const ActiveComponent = tabs.find(tb => tb.key === activeTab)?.Component ?? DashboardTasksTab;

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('dashboard.title') },
    ], [t]);

    // Check authorization
    useEffect(() => {
        verifyAuthorization(['admin','can_create_own_tribes']).catch((err) => {
            console.error('Authorization check failed:', err);
        });
    }, [verifyAuthorization]);

    const headerActions = (
        <>
        {authorization?.authorized && (
            <ThemedButton onClick={() => navigate('/app/tribes/create')} variant="primary">
                {t('tribes.createTribe')}
            </ThemedButton>
        )}


        <ThemedButton
            requiredPermissions={['admin']}
            variant="ghost"
            onClick={() => navigate('/admin')}
            theme={themesById['main_3']}
        >
            {t('common.admin')}
        </ThemedButton>

        </>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs} breadcrumbTabs={breadcrumbTabs} headerActions={headerActions}>

            {/* Authorization Error Message */}
            {authorizationError && (
                <ThemedCard>
                    <div style={errorStyle}>
                        <strong>Authorization Error:</strong> {authorizationError.message}
                    </div>
                </ThemedCard>
            )}

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
