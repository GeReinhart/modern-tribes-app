import { useProject } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { errorStyle, formContainerStyle } from '@/app/platform/core/layout/themes/theme.styles.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { guitarSongsService } from './service.ts';
import { SongForm } from './SongForm.tsx';
import { GuitarSongCreate } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

const SongFormPageContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tribeId, projectId, songId } = useParams<{
    tribeId: string;
    projectId: string;
    songId?: string;
  }>();
  const isEdit = !!songId;

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project } = useProject(projectId || null);
  const { song, loading: loadingSong } = useGuitarSong(isEdit ? songId || null : null);

  const viewPath = songId ? `/app/tribes/${tribeId}/projects/${projectId}/songs/${songId}` : null;
  const cancelPath = viewPath || `/app/tribes/${tribeId}/projects/${projectId}`;

  const breadcrumbs = [
    { label: t('common.home'), path: '/app' },
    { label: t('tribes.title'), path: '/app/tribes' },
    { label: tribe?.name || t('common.loading'), path: `/app/tribes/${tribeId}` },
    { label: project?.name || t('common.loading'), path: `/app/tribes/${tribeId}/projects/${projectId}` },
    { label: isEdit ? song?.title || t('common.loading') : t('guitarSong.form.addTitle') },
  ];

  const handleSubmit = async (data: GuitarSongCreate) => {
    if (!projectId) return;
    if (isEdit && songId) {
      await guitarSongsService.updateSong(songId, data);
      navigate(`/app/tribes/${tribeId}/projects/${projectId}/songs/${songId}`);
    } else {
      const created = await guitarSongsService.createSong(projectId, data);
      navigate(`/app/tribes/${tribeId}/projects/${projectId}/songs/${created.url_param_id}`);
    }
  };

  if (isEdit && loadingSong) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <ThemedLoadingSpinner size="sm" />
        </div>
      </AppLayout>
    );
  }

  if (isEdit && !loadingSong && !song) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <ThemedCard>
          <div style={errorStyle}>
            <strong>{t('common.error')}</strong> {t('guitarSong.detail.loadError')}
          </div>
        </ThemedCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div style={formContainerStyle}>
        <SongForm song={isEdit ? song ?? undefined : undefined} onSubmit={handleSubmit} onCancel={() => navigate(cancelPath)} />
      </div>
    </AppLayout>
  );
};

export const SongFormPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <SongFormPageContent />
  </ThemeProvider>
);
