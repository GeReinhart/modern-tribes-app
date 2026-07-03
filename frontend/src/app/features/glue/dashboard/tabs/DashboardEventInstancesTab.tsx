import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { DirectoryCard } from '@/app/features/glue/dashboard/DirectoryCard.tsx';
import { useDashboardDirectory } from '@/app/features/glue/dashboard/useDashboardDirectory.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const DashboardEventInstancesTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, loading } = useDashboardDirectory();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
        <ThemedLoadingSpinner size="sm" />
      </div>
    );
  }

  const instances = data?.event_instances ?? [];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instances.map((instance) => (
          <DirectoryCard
            key={instance.feature_instance_id}
            title={instance.instance_name ?? t('dashboard.directory.eventCalendar')}
            subtitle={`${instance.tribe_name} — ${instance.project_name}`}
            stats={[{ label: t('dashboard.directory.upcomingEvents'), value: instance.upcoming_count }]}
            onClick={() => navigate(
              `/app/tribes/${instance.tribe_url_param_id}/projects/${instance.project_url_param_id}/${instance.feature_instance_id}`,
            )}
          />
        ))}
      </div>
      {instances.length === 0 && (
        <ThemedCard variant="secondary">
          <ThemedText variant="secondary" size="medium">
            {t('dashboard.directory.noEventInstances')}
          </ThemedText>
        </ThemedCard>
      )}
    </div>
  );
};

export default DashboardEventInstancesTab;
