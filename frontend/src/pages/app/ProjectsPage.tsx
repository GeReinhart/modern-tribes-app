import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ThemedCard } from '@/components/common/layout/ThemedCard';
import { ThemedText } from '@/components/common/layout/ThemedText';
import { ThemedButton } from '@/components/common/form/ThemedButton';
import { ThemedDivider } from '@/components/common/layout/ThemedDivider';
import { ThemedLoadingSpinner } from '@/components/common/layout/ThemedLoadingSpinner';
import { ProjectCard } from '@/components/entities/projects/ProjectCard';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';
import { useUserProjects } from '@/hooks/useProjects';
import { ProjectEntry } from '@/types/queries/projects.query.types';

const ProjectsPageContent: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, isLoading: currentUserLoading } = useCurrentUserProfile();
    const { projects, loading: projectsLoading } = useUserProjects(user?.id || '', { enabled: !!user?.id });

    const breadcrumbs = useMemo(() => [
        { label: t('common.home'), path: '/app' },
        { label: t('projects.title') },
    ], [t]);

    const dedupedProjects = useMemo((): ProjectEntry[] => {
        const map = new Map<string, ProjectEntry>();
        for (const row of projects) {
            const existing = map.get(row.project_id);
            if (!existing) {
                map.set(row.project_id, {
                    project_id: row.project_id,
                    project_name: row.project_name,
                    direct_position: row.via_represents ? null : row.effective_position,
                    represented_persons: row.via_represents && row.person_first_name && row.person_last_name
                        ? [{ first_name: row.person_first_name, last_name: row.person_last_name, position: row.effective_position }]
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

    const headerActions = (
        <ThemedButton variant="ghost" onClick={() => navigate('/app/tribes')}>
            {t('tribes.title')}
        </ThemedButton>
    );

    if (currentUserLoading || projectsLoading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions}>
                <ThemedLoadingSpinner />
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs} headerActions={headerActions} bookmarkTitle={t('projects.title')}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <ThemedText variant="primary" size="small">
                        {t('projects.subtitle')}
                    </ThemedText>
                </div>

                <ThemedDivider variant="primary" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dedupedProjects.map(project => (
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
            </div>
        </AppLayout>
    );
};

export const ProjectsPage: React.FC = () => (
    <ThemeProvider defaultTheme="default">
        <ProjectsPageContent />
    </ThemeProvider>
);
