import { useEffect, useRef, useState } from 'react';

import { guitarSongsService } from './service.ts';
import { guitarSongLayoutService } from './layoutService.ts';
import { guitarSongLabelsService } from './labelsService.ts';
import { guitarSongVideosService } from './videosService.ts';
import * as layoutMutations from './layoutMutations.ts';
import {
  GuitarSongDetail,
  GuitarSongLayoutBlockContentUpdate,
  GuitarSongLayoutRow,
  GuitarSongLayoutRowInput,
  GuitarSongLayoutSettingsUpdate,
  GuitarSongLyricsWordChordUpdate,
  GuitarSongUpdate,
  GuitarSongVideoCreate,
  GuitarSongVideoUpdate,
  MoveDirection,
  WordChordPosition,
} from './types.ts';
import { CopiedBlock } from './useSongBlockClipboard.ts';

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

  const updateBlockLyrics = async (blockId: string, text: string) => {
    await guitarSongLayoutService.updateBlockContent(blockId, { lyrics_text: text });
    await reload();
  };

  const linkBlockTo = async (blockId: string, linkedToBlockId: string | null) => {
    await guitarSongLayoutService.updateBlockContent(blockId, { linked_to_block_id: linkedToBlockId });
    await reload();
  };

  const setWordChord = async (
    blockId: string, lineIndex: number, wordIndex: number, position: WordChordPosition,
    data: GuitarSongLyricsWordChordUpdate,
  ) => {
    await guitarSongLayoutService.setLyricsWordChord(blockId, lineIndex, wordIndex, position, data);
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

  // A copied block's content (lyrics, chord grid rows, rich text...) travels with it directly in
  // the row-replace payload (see layoutDraft.ts), so pasting is a single queued mutation -- no
  // second step to re-locate the just-created block and attach its content separately.
  const pasteBlock = (rowId: string, columnId: string, copied: CopiedBlock) => {
    const run = async () => {
      const latestRow = songRef.current?.layout.rows.find((row) => row.id === rowId);
      if (!latestRow) return;
      await guitarSongLayoutService.replaceRow(rowId, layoutMutations.pasteBlock(latestRow, columnId, copied));
      await reload();
    };
    const next = layoutMutationQueueRef.current.then(run, run);
    layoutMutationQueueRef.current = next;
    return next;
  };

  const pasteBlockToNewColumn = (rowId: string, copied: CopiedBlock) => {
    const run = async () => {
      const latestRow = songRef.current?.layout.rows.find((row) => row.id === rowId);
      if (!latestRow) return;
      await guitarSongLayoutService.replaceRow(rowId, layoutMutations.pasteToNewColumn(latestRow, copied));
      await reload();
    };
    const next = layoutMutationQueueRef.current.then(run, run);
    layoutMutationQueueRef.current = next;
    return next;
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

  const setMyMastery = async (masteryLevel: number) => {
    if (!songId) return;
    await guitarSongsService.setMyMastery(songId, masteryLevel);
    await reload();
  };

  return {
    song, loading, error, reload,
    updateSongFields,
    updateBlockLyrics, linkBlockTo, setWordChord,
    addVideo, updateVideo, moveVideo, removeVideo,
    addLayoutRow, replaceLayoutRow, pasteBlock, pasteBlockToNewColumn, moveLayoutRow, removeLayoutRow, updateLayoutSettings,
    updateLayoutBlockContent,
    toggleLabel,
    setMyMastery,
  };
};
