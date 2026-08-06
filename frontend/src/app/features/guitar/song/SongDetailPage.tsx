import { BookmarkToggle } from '@/app/features/bookmarks/BookmarkToggle.tsx';
import { buildBookmarkDescription } from '@/app/features/bookmarks/types.ts';
import { useProjectPermissions } from '@/app/features/tribes-projects/projects/useProjectPermissions.ts';
import { useProject } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { useDocumentTitle } from '@/app/platform/core/browser/useDocumentTitle.ts';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { errorStyle } from '@/app/platform/core/layout/themes/theme.styles.tsx';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { guitarSongsService } from './service.ts';
import { SongDetailBody } from './SongDetailBody.tsx';
import { songDocumentTitle } from './songDocumentTitle.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';

const SongDetailPageContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { tribeId, projectId, songId } = useParams<{ tribeId: string; projectId: string; songId: string }>();

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project } = useProject(projectId || null);
  const { isManager, canEdit } = useProjectPermissions(tribeId || null, projectId || null);
  const hook = useGuitarSong(songId || null);
  const { song, loading, error } = hook;
  const labelsHook = useGuitarSongLabels(projectId || null);
  useDocumentTitle(song ? songDocumentTitle(song, t('common.edit')) : undefined);

  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('tribes.title'), path: '/app/tribes' },
      { label: tribe?.name || t('common.loading'), path: `/app/tribes/${tribeId}` },
      { label: project?.name || t('common.loading'), path: `/app/tribes/${tribeId}/projects/${projectId}` },
      { label: song ? songDocumentTitle(song, t('common.edit')) : t('common.loading') },
    ],
    [tribe?.name, project?.name, song, tribeId, projectId, t],
  );

  const bookmarkSlot = song?.title ? (
    <BookmarkToggle
      pagePath={location.pathname}
      pageTitle={song.title}
      pageDescription={buildBookmarkDescription(breadcrumbs)}
    />
  ) : null;

  const handleArchive = async () => {
    if (!song) return;
    setArchiving(true);
    try {
      await guitarSongsService.archiveSong(song.id);
      navigate(`/app/tribes/${tribeId}/projects/${projectId}`);
    } finally {
      setArchiving(false);
      setArchiveConfirmOpen(false);
    }
  };

  const menuActions = useMemo(() => {
    if (!song) return [];
    return [
      {
        icon: 'eye' as const,
        label: t('guitarSong.layout.presentationMode'),
        path: `/app/tribes/${tribeId}/projects/${projectId}/songs/${songId}/present`,
      },
      ...(isManager
        ? [{ icon: 'trash' as const, label: t('guitarSong.detail.archive'), onClick: () => setArchiveConfirmOpen(true) }]
        : []),
    ];
  }, [song, isManager, t, tribeId, projectId, songId]);

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

  return (
    <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions} bookmarkSlot={bookmarkSlot}>
      <ThemedSection themeId="main_1">
        <SongDetailBody song={song} canEdit={canEdit} isManager={isManager} hook={hook} labelsHook={labelsHook} />
      </ThemedSection>
      <ThemedConfirmDialog
        isOpen={archiveConfirmOpen}
        onClose={() => setArchiveConfirmOpen(false)}
        onConfirm={handleArchive}
        title={t('guitarSong.detail.archiveTitle')}
        message={t('guitarSong.detail.archiveMessage', { title: song.title })}
        variant="danger"
        isLoading={archiving}
      />
    </AppLayout>
  );
};

export const SongDetailPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <SongDetailPageContent />
  </ThemeProvider>
);
