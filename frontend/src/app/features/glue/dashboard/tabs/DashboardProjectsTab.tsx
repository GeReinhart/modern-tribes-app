import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { DirectoryCard } from '@/app/features/glue/dashboard/DirectoryCard.tsx';
import { TribeFilterBadges } from '@/app/features/glue/dashboard/TribeFilterBadges.tsx';
import { useDashboardDirectory } from '@/app/features/glue/dashboard/useDashboardDirectory.ts';
import { useTribeFilter } from '@/app/features/glue/dashboard/useTribeFilter.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const DashboardProjectsTab: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, loading } = useDashboardDirectory();
  const allProjects = data?.projects ?? [];
  const { tribeOptions, selectedTribeIds, toggleTribe, filteredEntries: projects } = useTribeFilter(allProjects);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
        <ThemedLoadingSpinner size="sm" />
      </div>
    );
  }

  const emptyMessageKey = allProjects.length === 0 ? 'dashboard.directory.noProjects' : 'dashboard.directory.noFilterMatches';

  return (
    <div>
      <TribeFilterBadges tribes={tribeOptions} selectedTribeIds={selectedTribeIds} onToggle={toggleTribe} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <DirectoryCard
            key={project.project_id}
            title={project.project_name}
            subtitle={project.tribe_name}
            stats={[
              { label: t('dashboard.directory.openTasks'), value: project.open_task_count },
              { label: t('dashboard.directory.upcomingEvents'), value: project.upcoming_event_count },
            ]}
            onClick={() => navigate(`/app/tribes/${project.tribe_url_param_id}/projects/${project.project_url_param_id}`)}
          />
        ))}
      </div>
      {projects.length === 0 && (
        <ThemedCard variant="secondary">
          <ThemedText variant="secondary" size="medium">
            {t(emptyMessageKey)}
          </ThemedText>
        </ThemedCard>
      )}
    </div>
  );
};

export default DashboardProjectsTab;
