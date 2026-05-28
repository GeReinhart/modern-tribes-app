import { ThemedCard } from '@/platform/layout/themes/components/ThemedCard';
import { ThemedDivider } from '@/platform/layout/themes/components/ThemedDivider';
import { ThemedLoadingSpinner } from '@/platform/layout/themes/components/ThemedLoadingSpinner';
import { ThemedText } from '@/platform/layout/themes/components/ThemedText';
import { ProjectCard } from '@/components/entities/projects/ProjectCard';
import { AppLayout } from '@/platform/layout/AppLayout';
import { ThemeProvider } from '@/platform/layout/themes/ThemeContext.tsx';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';
import { useUserProjects } from '@/hooks/useProjects';
import { MenuAction } from '@/types/menu.types';
import { ProjectEntry } from '@/types/queries/projects.query.types';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const ProjectsPageContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isLoading: currentUserLoading } = useCurrentUserProfile();
  const { projects, loading: projectsLoading } = useUserProjects(
    user?.id || '',
    { enabled: !!user?.id },
  );

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('projects.title') },
    ],
    [t],
  );

  const dedupedProjects = useMemo((): ProjectEntry[] => {
    const map = new Map<string, ProjectEntry>();
    for (const row of projects) {
      const existing = map.get(row.project_id);
      if (!existing) {
        map.set(row.project_id, {
          project_id: row.project_id,
          project_url_param_id: row.project_url_param_id,
          project_name: row.project_name,
          direct_position: row.via_represents ? null : row.effective_position,
          represented_persons:
            row.via_represents && row.person_first_name && row.person_last_name
              ? [
                  {
                    first_name: row.person_first_name,
                    last_name: row.person_last_name,
                    position: row.effective_position,
                  },
                ]
              : [],
        });
      } else {
        if (!row.via_represents) {
          existing.direct_position = row.effective_position;
        } else if (row.person_first_name && row.person_last_name) {
          existing.represented_persons.push({
            first_name: row.person_first_name,
            last_name: row.person_last_name,
            position: row.effective_position,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [projects]);

  const menuActions = useMemo(
    (): MenuAction[] => [
      {
        icon: 'arrow-left',
        label: t('tribes.title'),
        onClick: () => navigate('/app/tribes'),
      },
    ],
    [t, navigate],
  );

  if (currentUserLoading || projectsLoading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions}>
        <ThemedLoadingSpinner />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      menuActions={menuActions}
      bookmarkTitle={t('projects.title')}
    >
      <ThemedText variant="primary" size="small">
        {t('projects.subtitle')}
      </ThemedText>

      <ThemedDivider variant="primary" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dedupedProjects.map((project) => (
          <ProjectCard key={project.project_id} project={project} />
        ))}
      </div>

      {dedupedProjects.length === 0 && (
        <ThemedCard variant="secondary">
          <ThemedText variant="secondary" size="medium">
            {t('projects.empty')}
          </ThemedText>
        </ThemedCard>
      )}
    </AppLayout>
  );
};

export const ProjectsPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <ProjectsPageContent />
  </ThemeProvider>
);
