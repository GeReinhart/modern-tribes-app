import { ThemedErrorMessage } from '@/app/platform/core/layout/themes/components/ThemedErrorMessage.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

import { SongCard } from './SongCard.tsx';
import { SongSearchFilters } from './SongSearchFilters.tsx';
import { GuitarSong, GuitarSongState } from './types.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';
import { useGuitarSongs } from './useGuitarSongs.ts';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
}

function toggleInArray<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const SongsTab: React.FC<Props> = ({ canEdit }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tribeId, projectId } = useParams<{ tribeId: string; projectId: string }>();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<GuitarSongState[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<number[]>([]);
  const [selectedMasteries, setSelectedMasteries] = useState<number[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { songs, loading, error, reload } = useGuitarSongs(projectId || '', {
    q: debouncedSearch || undefined,
    labelIds: selectedLabelIds,
    songStates: selectedStates,
    difficulties: selectedDifficulties,
    masteries: selectedMasteries,
  });
  const { labels } = useGuitarSongLabels(projectId || null);
  const hasActiveFilters = !!(
    debouncedSearch || selectedLabelIds.length || selectedStates.length
    || selectedDifficulties.length || selectedMasteries.length
  );

  const clearAllFilters = () => {
    setSearchInput('');
    setSelectedLabelIds([]);
    setSelectedStates([]);
    setSelectedDifficulties([]);
    setSelectedMasteries([]);
  };

  const openSong = (song: GuitarSong) => {
    const path = `/app/tribes/${tribeId}/projects/${projectId}/songs/${song.url_param_id}`;
    navigate(song.song_state === GuitarSongState.completed ? `${path}/present` : path);
  };

  const tabActions = useMemo(
    () => (canEdit
      ? [{
          icon: 'plus' as const, label: t('guitarSong.list.add'),
          onClick: () => navigate(`/app/tribes/${tribeId}/projects/${projectId}/songs/new`),
        }]
      : []),
    [canEdit, t, navigate, tribeId, projectId],
  );
  useRegisterTabActions(tabActions);

  if (loading) return <ThemedLoadingSpinner text={t('common.loading')} />;
  if (error) return <ThemedErrorMessage message={t('guitarSong.list.loadError')} onRetry={reload} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '16px' }}>
      <SongSearchFilters
        labels={labels}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        selectedLabelIds={selectedLabelIds}
        onToggleLabel={(id) => setSelectedLabelIds((prev) => toggleInArray(prev, id))}
        selectedStates={selectedStates}
        onToggleState={(state) => setSelectedStates((prev) => toggleInArray(prev, state))}
        selectedDifficulties={selectedDifficulties}
        onToggleDifficulty={(value) => setSelectedDifficulties((prev) => toggleInArray(prev, value))}
        selectedMasteries={selectedMasteries}
        onToggleMastery={(value) => setSelectedMasteries((prev) => toggleInArray(prev, value))}
        onClearAll={clearAllFilters}
      />
      {songs.length === 0 && hasActiveFilters && (
        <ThemedText variant="secondary" size="small">{t('guitarSong.list.noResults')}</ThemedText>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {songs.map((song) => (
          <SongCard key={song.id} song={song} labels={labels} onOpen={() => openSong(song)} />
        ))}
      </div>
    </div>
  );
};

export default SongsTab;
