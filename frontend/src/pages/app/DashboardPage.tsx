import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedTabs } from '@/components/common/layout/ThemedTabs';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { themesById } from '@/components/themes/themes';
import { useVerifyAuthorization } from "@/hooks/userVerifyAuthorization.ts";
import DashboardTasksTab from '@/features/dashboard/tabs/DashboardTasksTab';
import DashboardTribesTab from '@/features/dashboard/tabs/DashboardTribesTab';
import { ThemedCard } from "@/components/common/layout/ThemedCard.tsx";
import { errorStyle } from "@/styles/theme.styles.tsx";
import { useUrlTab } from '@/hooks/useUrlTab';
import { Settings } from 'lucide-react';
import { useTabConfig } from '@/features/tab-config/useTabConfig';
import { TabConfigPopup } from '@/features/tab-config/TabConfigPopup';

const TABS = (t: (k: string) => string) => [
    { key: 'tasks', label: t('dashboard.tabs.tasks'), Component: DashboardTasksTab },
    { key: 'tribes', label: t('dashboard.tabs.tribes'), Component: DashboardTribesTab },
];

const DashboardPageContent: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { data: authorization, error: authorizationError, verifyAuthorization } = useVerifyAuthorization();
    const [showTabConfig, setShowTabConfig] = useState(false);

    const allTabs = useMemo(() => TABS(t).map(({ key, label }) => ({ key, label })), [t]);
    const { visibleTabs, defaultTabKey, tabsWithConfig, saveConfig } = useTabConfig('dashboard', allTabs);
    const { activeTab, breadcrumbTabs, handleTabChange } = useUrlTab(visibleTabs, '/app/dashboard', defaultTabKey);
    const ActiveComponent = TABS(t).find(tb => tb.key === activeTab)?.Component ?? DashboardTasksTab;

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

            {showTabConfig && (
                <TabConfigPopup
                    tabsWithConfig={tabsWithConfig}
                    onSave={saveConfig}
                    onClose={() => setShowTabConfig(false)}
                />
            )}

            {/* Authorization Error Message */}
            {authorizationError && (
                <ThemedCard>
                    <div style={errorStyle}>
                        <strong>Authorization Error:</strong> {authorizationError.message}
                    </div>
                </ThemedCard>
            )}

            <ThemedTabs
                tabs={visibleTabs}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                configButton={
                    <button
                        onClick={() => setShowTabConfig(true)}
                        title={t('tabConfig.configure')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.secondary, display: 'flex', alignItems: 'center', padding: '4px' }}
                    >
                        <Settings size={16} />
                    </button>
                }
            />
            <ActiveComponent />
        </AppLayout>
    );
};

const DashboardPage: React.FC = () => (
    <ThemeProvider defaultTheme="default"><DashboardPageContent /></ThemeProvider>
);

export default DashboardPage;
