import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { DirectoryCard } from '@/app/features/glue/dashboard/DirectoryCard.tsx';
import { TribeFilterBadges } from '@/app/features/glue/dashboard/TribeFilterBadges.tsx';
import { useDashboardDirectory } from '@/app/features/glue/dashboard/useDashboardDirectory.ts';
import { useTribeFilter } from '@/app/features/glue/dashboard/useTribeFilter.ts';
import type { TaskInstanceDirectoryEntry } from '@/app/features/glue/dashboard/dashboardDirectory.types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

function instanceTitle(instance: TaskInstanceDirectoryEntry, t: (key: string) => string): string {
  if (instance.instance_name) return instance.instance_name;
  return instance.feature_type === 'kanban'
    ? t('dashboard.directory.kanbanBoard')
    : t('dashboard.directory.todoList');
}

const DashboardTaskInstancesTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, loading } = useDashboardDirectory();
  const allInstances = data?.task_instances ?? [];
  const { tribeOptions, selectedTribeIds, toggleTribe, filteredEntries: instances } = useTribeFilter(allInstances);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
        <ThemedLoadingSpinner size="sm" />
      </div>
    );
  }

  const emptyMessageKey = allInstances.length === 0 ? 'dashboard.directory.noTaskInstances' : 'dashboard.directory.noFilterMatches';

  return (
    <div>
      <TribeFilterBadges tribes={tribeOptions} selectedTribeIds={selectedTribeIds} onToggle={toggleTribe} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instances.map((instance) => (
          <DirectoryCard
            key={instance.feature_instance_id}
            title={instanceTitle(instance, t)}
            subtitle={`${instance.tribe_name} — ${instance.project_name}`}
            stats={[{ label: t('dashboard.directory.openTasks'), value: instance.open_count }]}
            onClick={() => navigate(
              `/app/tribes/${instance.tribe_url_param_id}/projects/${instance.project_url_param_id}/${instance.feature_instance_id}`,
            )}
          />
        ))}
      </div>
      {instances.length === 0 && (
        <ThemedCard variant="secondary">
          <ThemedText variant="secondary" size="medium">
            {t(emptyMessageKey)}
          </ThemedText>
        </ThemedCard>
      )}
    </div>
  );
};

export default DashboardTaskInstancesTab;
