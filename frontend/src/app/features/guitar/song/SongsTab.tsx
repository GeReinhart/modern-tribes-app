import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedErrorMessage } from '@/app/platform/core/layout/themes/components/ThemedErrorMessage.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { SongCard } from './SongCard.tsx';
import { GuitarSong } from './types.ts';
import { useGuitarSongs } from './useGuitarSongs.ts';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
}

const SongsTab: React.FC<Props> = ({ canEdit }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tribeId, projectId } = useParams<{ tribeId: string; projectId: string }>();
  const { songs, loading, error, reload } = useGuitarSongs(projectId || '');

  const openSong = (song: GuitarSong) => {
    navigate(`/app/tribes/${tribeId}/projects/${projectId}/songs/${song.url_param_id}`);
  };

  if (loading) return <ThemedLoadingSpinner text={t('common.loading')} />;
  if (error) return <ThemedErrorMessage message={t('guitarSong.list.loadError')} onRetry={reload} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
      {canEdit && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ThemedButton
            onClick={() => navigate(`/app/tribes/${tribeId}/projects/${projectId}/songs/new`)}
            fullWidth={false}
          >
            {t('guitarSong.list.add')}
          </ThemedButton>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {songs.map((song) => (
          <SongCard key={song.id} song={song} onOpen={() => openSong(song)} />
        ))}
      </div>
    </div>
  );
};

export default SongsTab;
