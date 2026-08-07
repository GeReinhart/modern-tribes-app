import { useProject } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { useDocumentTitle } from '@/app/platform/core/browser/useDocumentTitle.ts';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemeProvider, useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { errorStyle } from '@/app/platform/core/layout/themes/theme.styles.tsx';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { SongDetailBody } from './SongDetailBody.tsx';
import { SongPageSizeControl } from './SongPageSizeControl.tsx';
import { SongPresentationSettings } from './SongPresentationSettings.tsx';
import { songDocumentTitle } from './songDocumentTitle.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';
import { usePresentationPageSize } from './usePresentationPageSize.ts';
import { useSongPdfDownload } from './useSongPdfDownload.ts';

const SongPresentationPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { tribeId, projectId, songId } = useParams<{ tribeId: string; projectId: string; songId: string }>();

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project } = useProject(projectId || null);
  const hook = useGuitarSong(songId || null);
  const { song, loading, error } = hook;
  const labelsHook = useGuitarSongLabels(projectId || null);
  const { download: downloadPdf, downloading: downloadingPdf } = useSongPdfDownload(song?.id || '', song?.title || '');
  const { pageSize, setPageSize, maxWidth } = usePresentationPageSize();
  const [pageSizeModalOpen, setPageSizeModalOpen] = useState(false);
  const [marginsModalOpen, setMarginsModalOpen] = useState(false);
  useDocumentTitle(song ? songDocumentTitle(song) : undefined);

  const songPath = `/app/tribes/${tribeId}/projects/${projectId}/songs/${songId}`;

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('tribes.title'), path: '/app/tribes' },
      { label: tribe?.name || t('common.loading'), path: `/app/tribes/${tribeId}` },
      { label: project?.name || t('common.loading'), path: `/app/tribes/${tribeId}/projects/${projectId}` },
      { label: song?.title || t('common.loading'), path: songPath },
      { label: song ? songDocumentTitle(song) : t('common.loading') },
    ],
    [tribe?.name, project?.name, song, tribeId, projectId, songPath, t],
  );

  const menuActions = useMemo(
    () => [
      { icon: 'arrow-left' as const, label: t('guitarSong.layout.backToSong'), path: songPath },
      { icon: 'printer' as const, label: t('guitarSong.layout.pageSizeLabel'), onClick: () => setPageSizeModalOpen(true) },
      { icon: 'layout' as const, label: t('guitarSong.layout.openMarginsMenu'), onClick: () => setMarginsModalOpen(true) },
      {
        icon: 'download' as const, label: t('guitarSong.layout.downloadPdf'), onClick: downloadPdf,
        disabled: downloadingPdf,
      },
    ],
    [songPath, t, downloadPdf, downloadingPdf],
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

  const settings = song.layout.settings;
  const pageFrameStyle: React.CSSProperties = {
    maxWidth,
    margin: maxWidth ? '0 auto' : undefined,
    boxSizing: 'border-box',
    padding: `${settings.margin_top_mm}mm ${settings.margin_right_mm}mm ${settings.margin_bottom_mm}mm ${settings.margin_left_mm}mm`,
    border: maxWidth ? `1px solid ${theme.colors.border}` : undefined,
    boxShadow: maxWidth ? 'var(--shadow-md)' : undefined,
    backgroundColor: theme.colors.surface,
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions}>
      <ThemedSection themeId="main_1">
        <div style={pageFrameStyle}>
          <SongDetailBody song={song} canEdit={false} isManager={false} hook={hook} labelsHook={labelsHook} />
        </div>
      </ThemedSection>
      <SongPageSizeControl
        pageSize={pageSize} onChange={setPageSize} isOpen={pageSizeModalOpen} onClose={() => setPageSizeModalOpen(false)}
      />
      <SongPresentationSettings song={song} hook={hook} isOpen={marginsModalOpen} onClose={() => setMarginsModalOpen(false)} />
    </AppLayout>
  );
};

export const SongPresentationPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <SongPresentationPageContent />
  </ThemeProvider>
);
