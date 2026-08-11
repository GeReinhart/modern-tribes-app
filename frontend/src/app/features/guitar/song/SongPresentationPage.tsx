import { useProjectPermissions } from '@/app/features/tribes-projects/projects/useProjectPermissions.ts';
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
import { useNavigate, useParams } from 'react-router-dom';

import { SongDetailBody } from './SongDetailBody.tsx';
import { SongDifficultyBand } from './SongDifficultyBand.tsx';
import { SongLabelsBand } from './SongLabelsBand.tsx';
import { SongLearningToolsPanel } from './SongLearningToolsPanel.tsx';
import { SongMasteryBand } from './SongMasteryBand.tsx';
import { SongPageSettings } from './SongPageSettings.tsx';
import { songDocumentTitle } from './songDocumentTitle.ts';
import { GuitarSongState } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';
import { usePresentationPageSize } from './usePresentationPageSize.ts';
import { useShowLayoutOutlines } from './useShowLayoutOutlines.ts';
import { useSongBlockClipboard } from './useSongBlockClipboard.ts';
import { useSongListPath } from './useSongListPath.ts';
import { useSongPdfDownload } from './useSongPdfDownload.ts';

const SongPresentationPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { tribeId, projectId, songId } = useParams<{ tribeId: string; projectId: string; songId: string }>();
  const navigate = useNavigate();

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project } = useProject(projectId || null);
  const { canEdit, isManager } = useProjectPermissions(tribeId || null, projectId || null);
  const hook = useGuitarSong(songId || null);
  const { song, loading, error } = hook;
  const labelsHook = useGuitarSongLabels(projectId || null);
  const { download: downloadPdf, downloading: downloadingPdf } = useSongPdfDownload(song?.id || '', song?.title || '');
  const { pageSize, setPageSize, customWidthMm, setCustomWidthMm, maxWidth } = usePresentationPageSize();
  const { showOutlines, setShowOutlines } = useShowLayoutOutlines();
  // SongDetailBody is always rendered read-only here regardless of canEdit -- this clipboardHook
  // only exists to satisfy its shared prop signature, never actually used for copy/paste.
  const clipboardHook = useSongBlockClipboard();
  const [pageSettingsModalOpen, setPageSettingsModalOpen] = useState(false);
  const [labelsModalOpen, setLabelsModalOpen] = useState(false);
  const [learningToolsOpen, setLearningToolsOpen] = useState(false);
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

  const isCompleted = song?.song_state === GuitarSongState.completed;
  const songListPath = useSongListPath(tribeId || null, projectId || null);
  const handleBackToDraft = async () => {
    await hook.updateSongFields({ song_state: GuitarSongState.draft });
    navigate(songPath);
  };

  const menuActions = useMemo(
    () => [
      { icon: 'search' as const, label: t('guitarSong.detail.backToList'), path: songListPath },
      ...(isCompleted
        ? (canEdit ? [{ icon: 'pencil' as const, label: t('guitarSong.detail.backToDraft'), onClick: handleBackToDraft }] : [])
        : [{ icon: 'arrow-left' as const, label: t('guitarSong.layout.backToSong'), path: songPath }]),
      { icon: 'printer' as const, label: t('guitarSong.layout.pageSettingsLabel'), onClick: () => setPageSettingsModalOpen(true) },
      {
        icon: 'headphones' as const, label: t('guitarSong.learningTools.title'), onClick: () => setLearningToolsOpen(true),
      },
      ...(canEdit
        ? [{
            icon: 'tag' as const, label: t('guitarSong.labels.manageLabels'),
            onClick: () => setLabelsModalOpen(true),
          }]
        : []),
      {
        icon: 'grid' as const,
        label: showOutlines ? t('guitarSong.layout.hideStructureOutlines') : t('guitarSong.layout.showStructureOutlines'),
        onClick: () => setShowOutlines(!showOutlines),
      },
      {
        icon: 'download' as const, label: t('guitarSong.layout.downloadPdf'), onClick: downloadPdf,
        disabled: downloadingPdf,
      },
    ],
    [songPath, songListPath, t, downloadPdf, downloadingPdf, showOutlines, setShowOutlines, isCompleted, canEdit],
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <SongDifficultyBand song={song} hook={hook} canEdit={false} />
            <SongLabelsBand
              song={song} hook={hook} labelsHook={labelsHook} canManage={canEdit && isManager}
              isManageOpen={labelsModalOpen} onCloseManage={() => setLabelsModalOpen(false)}
            />
          </div>
          <SongMasteryBand song={song} hook={hook} />
        </div>
        <div style={pageFrameStyle}>
          <SongDetailBody
            song={song} canEdit={false} isManager={false} hook={hook} labelsHook={labelsHook}
            clipboardHook={clipboardHook} showStructureOutlines={showOutlines}
          />
        </div>
      </ThemedSection>
      <SongPageSettings
        song={song} hook={hook}
        pageSize={pageSize} onChangePageSize={setPageSize} customWidthMm={customWidthMm} onChangeCustomWidthMm={setCustomWidthMm}
        isOpen={pageSettingsModalOpen} onClose={() => setPageSettingsModalOpen(false)}
      />
      <SongLearningToolsPanel
        // Read-only here, unlike SongDetailPage's edit screen -- the presentation view only ever
        // shows the finished result, never editing controls, so watching a video (not a form to
        // manage it) is the only thing this modal offers here, matching SongDetailBody's own
        // hardcoded canEdit=false just above.
        song={song} hook={hook} canManage={false}
        isOpen={learningToolsOpen} onClose={() => setLearningToolsOpen(false)}
      />
    </AppLayout>
  );
};

export const SongPresentationPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <SongPresentationPageContent />
  </ThemeProvider>
);
