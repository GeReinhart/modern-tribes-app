import { useProject } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { formContainerStyle } from '@/app/platform/core/layout/themes/theme.styles.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { guitarSongsService } from './service.ts';
import { SongForm } from './SongForm.tsx';
import { GuitarSongCreate } from './types.ts';

const SongFormPageContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tribeId, projectId } = useParams<{ tribeId: string; projectId: string }>();

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project } = useProject(projectId || null);

  const cancelPath = `/app/tribes/${tribeId}/projects/${projectId}`;

  const breadcrumbs = [
    { label: t('common.home'), path: '/app' },
    { label: t('tribes.title'), path: '/app/tribes' },
    { label: tribe?.name || t('common.loading'), path: `/app/tribes/${tribeId}` },
    { label: project?.name || t('common.loading'), path: `/app/tribes/${tribeId}/projects/${projectId}` },
    { label: t('guitarSong.form.addTitle') },
  ];

  const handleSubmit = async (data: GuitarSongCreate) => {
    if (!projectId) return;
    const created = await guitarSongsService.createSong(projectId, data);
    navigate(`/app/tribes/${tribeId}/projects/${projectId}/songs/${created.url_param_id}`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div style={formContainerStyle}>
        <SongForm projectId={projectId || null} onSubmit={handleSubmit} onCancel={() => navigate(cancelPath)} />
      </div>
    </AppLayout>
  );
};

export const SongFormPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <SongFormPageContent />
  </ThemeProvider>
);
