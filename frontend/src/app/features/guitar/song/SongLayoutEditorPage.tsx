import { useProjectPermissions } from '@/app/features/tribes-projects/projects/useProjectPermissions.ts';
import { useProject } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { errorStyle } from '@/app/platform/core/layout/themes/theme.styles.tsx';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { SongLayoutEditorBody } from './SongLayoutEditorBody.tsx';
import { useGuitarSong } from './useGuitarSong.ts';

const SongLayoutEditorPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { tribeId, projectId, songId } = useParams<{ tribeId: string; projectId: string; songId: string }>();

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project } = useProject(projectId || null);
  const { canEdit } = useProjectPermissions(tribeId || null, projectId || null);
  const hook = useGuitarSong(songId || null);
  const { song, loading, error } = hook;

  const songPath = `/app/tribes/${tribeId}/projects/${projectId}/songs/${songId}`;

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('tribes.title'), path: '/app/tribes' },
      { label: tribe?.name || t('common.loading'), path: `/app/tribes/${tribeId}` },
      { label: project?.name || t('common.loading'), path: `/app/tribes/${tribeId}/projects/${projectId}` },
      { label: song?.title || t('common.loading'), path: songPath },
      { label: t('guitarSong.layout.title') },
    ],
    [tribe?.name, project?.name, song?.title, tribeId, projectId, songPath, t],
  );

  const menuActions = useMemo(
    () => [{ icon: 'arrow-left' as const, label: t('guitarSong.layout.backToSong'), path: songPath }],
    [songPath, t],
  );

  if (loading && !song) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <ThemedLoadingSpinner size="sm" />
        </div>
      </AppLayout>
    );
  }
  if (error || !song) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div style={errorStyle}>
          <strong>{t('common.error')}</strong> {error || t('guitarSong.detail.loadError')}
        </div>
      </AppLayout>
    );
  }
  if (!canEdit) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div style={errorStyle}>{t('guitarSong.layout.noAccess')}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions}>
      <ThemedSection themeId="main_1">
        <SongLayoutEditorBody song={song} hook={hook} />
      </ThemedSection>
    </AppLayout>
  );
};

export const SongLayoutEditorPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <SongLayoutEditorPageContent />
  </ThemeProvider>
);
