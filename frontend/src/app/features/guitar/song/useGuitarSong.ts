import { useEffect, useRef, useState } from 'react';

import { guitarSongsService } from './service.ts';
import { guitarSongLayoutService } from './layoutService.ts';
import { guitarSongSectionsService } from './sectionsService.ts';
import { guitarSongLabelsService } from './labelsService.ts';
import { guitarSongVideosService } from './videosService.ts';
import {
  GuitarSongChordCreate,
  GuitarSongChordUpdate,
  GuitarSongDetail,
  GuitarSongLayoutBlockContentUpdate,
  GuitarSongLayoutRow,
  GuitarSongLayoutRowInput,
  GuitarSongLayoutSettingsUpdate,
  GuitarSongSectionChordCreate,
  GuitarSongSectionCreate,
  GuitarSongSectionLyricsUpdate,
  GuitarSongSectionUpdate,
  GuitarSongSectionWordChordUpdate,
  GuitarSongUpdate,
  GuitarSongVideoCreate,
  GuitarSongVideoUpdate,
  MoveDirection,
  WordChordPosition,
} from './types.ts';

export const useGuitarSong = (songId: string | null) => {
  const [song, setSong] = useState<GuitarSongDetail | null>(null);
  const [loading, setLoading] = useState(!!songId);
  const [error, setError] = useState<string | null>(null);
  // Mirrors `song` synchronously (state updates only take effect on the next render), so a
  // layout mutation queued right after another one's response lands still builds its payload
  // from that fresh row -- not from the stale prop closure it was originally called with.
  const songRef = useRef<GuitarSongDetail | null>(null);
  // Layout row replacements fully replace a row's columns/blocks server-side (see
  // repository.replace_row), so two fired back-to-back from the same stale row snapshot (e.g.
  // tabbing through several padding fields before the first save's reload finishes) would have
  // the later one silently overwrite the earlier one's change. Queuing them lets each one start
  // from the previous one's already-reloaded result.
  const layoutMutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  const reload = async () => {
    if (!songId) return;
    setLoading(true);
    setError(null);
    try {
      const freshSong = await guitarSongsService.getSong(songId);
      songRef.current = freshSong;
      setSong(freshSong);
    } catch (err) {
      console.error('Failed to reload guitar song', err);
      setError('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, [songId]);

  const updateSongFields = async (data: GuitarSongUpdate) => {
    if (!songId) return;
    await guitarSongsService.updateSong(songId, data);
    await reload();
  };

  const addChord = async (data: GuitarSongChordCreate) => {
    if (!songId) return;
    await guitarSongsService.addChordToSong(songId, data);
    await reload();
  };

  const updateComment = async (songChordId: string, data: GuitarSongChordUpdate) => {
    await guitarSongsService.updateSongChordComment(songChordId, data);
    await reload();
  };

  const moveChord = async (songChordId: string, direction: MoveDirection) => {
    await guitarSongsService.moveSongChord(songChordId, direction);
    await reload();
  };

  const removeChord = async (songChordId: string) => {
    await guitarSongsService.removeSongChord(songChordId);
    await reload();
  };

  const addSection = async (data: GuitarSongSectionCreate) => {
    if (!songId) return;
    await guitarSongSectionsService.createSection(songId, data);
    await reload();
  };

  const updateSection = async (sectionId: string, data: GuitarSongSectionUpdate) => {
    await guitarSongSectionsService.updateSection(sectionId, data);
    await reload();
  };

  const moveSection = async (sectionId: string, direction: MoveDirection) => {
    await guitarSongSectionsService.moveSection(sectionId, direction);
    await reload();
  };

  const removeSection = async (sectionId: string) => {
    await guitarSongSectionsService.archiveSection(sectionId);
    await reload();
  };

  const duplicateSection = async (sectionId: string) => {
    await guitarSongSectionsService.duplicateSection(sectionId);
    await reload();
  };

  const updateSectionLyrics = async (sectionId: string, data: GuitarSongSectionLyricsUpdate) => {
    await guitarSongSectionsService.updateLyrics(sectionId, data);
    await reload();
  };

  const setWordChord = async (
    wordId: string, position: WordChordPosition, data: GuitarSongSectionWordChordUpdate,
  ) => {
    await guitarSongSectionsService.setWordChord(wordId, position, data);
    await reload();
  };

  const addChordToSection = async (sectionId: string, data: GuitarSongSectionChordCreate) => {
    await guitarSongSectionsService.addChordToSection(sectionId, data);
    await reload();
  };

  const moveSectionChord = async (sectionChordId: string, direction: MoveDirection) => {
    await guitarSongSectionsService.moveSectionChord(sectionChordId, direction);
    await reload();
  };

  const removeSectionChord = async (sectionChordId: string) => {
    await guitarSongSectionsService.removeSectionChord(sectionChordId);
    await reload();
  };

  const addVideo = async (data: GuitarSongVideoCreate) => {
    if (!songId) return;
    await guitarSongVideosService.addVideo(songId, data);
    await reload();
  };

  const updateVideo = async (videoId: string, data: GuitarSongVideoUpdate) => {
    await guitarSongVideosService.updateVideo(videoId, data);
    await reload();
  };

  const moveVideo = async (videoId: string, direction: MoveDirection) => {
    await guitarSongVideosService.moveVideo(videoId, direction);
    await reload();
  };

  const removeVideo = async (videoId: string) => {
    await guitarSongVideosService.removeVideo(videoId);
    await reload();
  };

  const addLayoutRow = async (data: GuitarSongLayoutRowInput, insertBeforeRowId?: string) => {
    if (!songId) return;
    await guitarSongLayoutService.addRow(songId, data, insertBeforeRowId);
    await reload();
  };

  const replaceLayoutRow = (rowId: string, buildInput: (latestRow: GuitarSongLayoutRow) => GuitarSongLayoutRowInput) => {
    const run = async () => {
      const latestRow = songRef.current?.layout.rows.find((row) => row.id === rowId);
      if (!latestRow) return;
      await guitarSongLayoutService.replaceRow(rowId, buildInput(latestRow));
      await reload();
    };
    const next = layoutMutationQueueRef.current.then(run, run);
    layoutMutationQueueRef.current = next;
    return next;
  };

  const moveLayoutRow = async (rowId: string, direction: MoveDirection) => {
    await guitarSongLayoutService.moveRow(rowId, direction);
    await reload();
  };

  const removeLayoutRow = async (rowId: string) => {
    await guitarSongLayoutService.removeRow(rowId);
    await reload();
  };

  const updateLayoutSettings = async (data: GuitarSongLayoutSettingsUpdate) => {
    if (!songId) return;
    await guitarSongLayoutService.updateSettings(songId, data);
    await reload();
  };

  const updateLayoutBlockContent = async (blockId: string, data: GuitarSongLayoutBlockContentUpdate) => {
    await guitarSongLayoutService.updateBlockContent(blockId, data);
    await reload();
  };

  const toggleLabel = async (labelId: string, attached: boolean) => {
    if (!songId) return;
    if (attached) {
      await guitarSongLabelsService.removeLabelFromSong(songId, labelId);
    } else {
      await guitarSongLabelsService.addLabelToSong(songId, labelId);
    }
    await reload();
  };

  return {
    song, loading, error, reload,
    updateSongFields,
    addChord, updateComment, moveChord, removeChord,
    addSection, updateSection, moveSection, removeSection, duplicateSection, updateSectionLyrics,
    setWordChord, addChordToSection, moveSectionChord, removeSectionChord,
    addVideo, updateVideo, moveVideo, removeVideo,
    addLayoutRow, replaceLayoutRow, moveLayoutRow, removeLayoutRow, updateLayoutSettings, updateLayoutBlockContent,
    toggleLabel,
  };
};
