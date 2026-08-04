import { BookmarkToggle } from '@/app/features/bookmarks/BookmarkToggle.tsx';
import { buildBookmarkDescription } from '@/app/features/bookmarks/types.ts';
import { useProjectPermissions } from '@/app/features/tribes-projects/projects/useProjectPermissions.ts';
import { useProject } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemeProvider, useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { errorStyle } from '@/app/platform/core/layout/themes/theme.styles.tsx';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { AddChordToSongModal } from './AddChordToSongModal.tsx';
import { guitarSongsService } from './service.ts';
import { SongChordRow } from './SongChordRow.tsx';
import { SongMetronomeControls } from './SongMetronomeControls.tsx';
import { SongStatCard } from './SongStatCard.tsx';
import { useGuitarSong } from './useGuitarSong.ts';

const SongDetailPageContent: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { tribeId, projectId, songId } = useParams<{ tribeId: string; projectId: string; songId: string }>();

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project } = useProject(projectId || null);
  const { isManager, canEdit } = useProjectPermissions(tribeId || null, projectId || null);
  const { song, loading, error, addChord, updateComment, moveChord, removeChord } = useGuitarSong(songId || null);

  const [writeMode, setWriteMode] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const chordsEditable = writeMode && canEdit;
  const chordsManageable = writeMode && isManager;

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('tribes.title'), path: '/app/tribes' },
      { label: tribe?.name || t('common.loading'), path: `/app/tribes/${tribeId}` },
      { label: project?.name || t('common.loading'), path: `/app/tribes/${tribeId}/projects/${projectId}` },
      { label: song?.title || t('common.loading') },
    ],
    [tribe?.name, project?.name, song?.title, tribeId, projectId, t],
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
      ...(canEdit
        ? [{
            icon: 'pencil' as const,
            label: t('common.edit'),
            path: `/app/tribes/${tribeId}/projects/${projectId}/songs/${songId}/edit`,
          }]
        : []),
      ...(isManager
        ? [{ icon: 'trash' as const, label: t('guitarSong.detail.archive'), onClick: () => setArchiveConfirmOpen(true) }]
        : []),
    ];
  }, [song, canEdit, isManager, t, tribeId, projectId, songId]);

  if (loading) {
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

  const chordIds = song.chords.map((sc) => sc.chord.id);

  return (
    <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions} bookmarkSlot={bookmarkSlot}>
      <ThemedSection themeId="main_1">
        {song.author && (
          <div style={{ fontSize: '20px', fontWeight: 600, color: theme.colors.primary, marginBottom: '12px' }}>
            {song.author}
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <SongStatCard label={t('guitarSong.detail.statBpm')} value={song.tempo_bpm} />
          <SongStatCard label={t('guitarSong.detail.statBeatsPerBar')} value={song.beats_per_bar} />
          <SongStatCard label={t('guitarSong.detail.statCapo')} value={song.capo > 0 ? song.capo : '–'} />
        </div>
        {writeMode ? (
          <SongMetronomeControls tempoBpm={song.tempo_bpm} beatsPerBar={song.beats_per_bar} />
        ) : (
          <ThemedCard bordered className="p-3">
            <SongMetronomeControls tempoBpm={song.tempo_bpm} beatsPerBar={song.beats_per_bar} />
          </ThemedCard>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0 12px' }}>
          <div style={{ fontWeight: 600, color: theme.colors.text }}>{t('guitarSong.detail.chords')}</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {chordsEditable && (
              <ThemedIconButton
                action={{ icon: 'plus', label: t('guitarSong.detail.addChord'), onClick: () => setPickerOpen(true) }}
              />
            )}
            {canEdit && (
              <ThemedIconButton
                action={{
                  icon: writeMode ? 'eye' : 'pencil',
                  label: writeMode ? t('guitarSong.detail.readMode') : t('guitarSong.detail.writeMode'),
                  onClick: () => setWriteMode(!writeMode),
                }}
              />
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {song.chords.map((songChord, index) => (
            <SongChordRow
              key={songChord.id}
              songChord={songChord}
              isFirst={index === 0}
              isLast={index === song.chords.length - 1}
              canEdit={chordsEditable}
              canManage={chordsManageable}
              onMoveUp={() => moveChord(songChord.id, 'prev')}
              onMoveDown={() => moveChord(songChord.id, 'next')}
              onRemove={() => removeChord(songChord.id)}
              onCommentBlur={(comment) => updateComment(songChord.id, { comment: comment || null })}
            />
          ))}
        </div>
      </ThemedSection>
      <AddChordToSongModal
        isOpen={pickerOpen}
        existingChordIds={chordIds}
        onClose={() => setPickerOpen(false)}
        onPickChord={async (chordId) => { await addChord({ chord_id: chordId }); }}
      />
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
