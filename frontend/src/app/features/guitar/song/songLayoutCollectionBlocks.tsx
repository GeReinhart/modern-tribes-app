import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';

import React from 'react';

import { SongChordDiagramPrefs } from './SongChordDiagramPrefs.tsx';
import { isBlankHtml, SongChordGridBlock } from './SongChordGridBlock.tsx';
import { SongChordRow } from './SongChordRow.tsx';
import { SongEditableBlockTitle } from './SongEditableBlockTitle.tsx';
import { SongFormChordGridSection } from './SongFormChordGridSection.tsx';
import { SongFormChordsSection } from './SongFormChordsSection.tsx';
import { SongFormLabelsSection } from './SongFormLabelsSection.tsx';
import { SongFormVideosSection } from './SongFormVideosSection.tsx';
import { SongLabelChips } from './SongLabelChips.tsx';
import { SongLyricsBlockEditor } from './SongLyricsBlockEditor.tsx';
import { SongLyricsBlockReadView } from './SongLyricsBlockReadView.tsx';
import { SongLyricsBlockSetup } from './SongLyricsBlockSetup.tsx';
import { SongLyricsPresentationPrefs } from './SongLyricsPresentationPrefs.tsx';
import { SongVideoList } from './SongVideoList.tsx';
import { swapAdjacent } from './arrayMutations.ts';
import { findBlocksOfType } from './layoutBlockOptions.ts';
import { BlockChordInput, GuitarSongChord, GuitarSongDetail, GuitarSongLayoutBlock, GuitarSongLayoutBlockContentUpdate } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';

const toBlockChordInput = (blockChord: GuitarSongChord): BlockChordInput => (
  { chord_id: blockChord.chord_id, comment: blockChord.comment }
);

export const renderChordsBlock = (
  block: GuitarSongLayoutBlock, song: GuitarSongDetail, canEdit: boolean, canManage: boolean,
  hook: ReturnType<typeof useGuitarSong>, t: (key: string) => string, onSaveTitle: (customTitle: string | null) => Promise<void>,
): React.ReactNode => {
  const chords = block.chords ?? [];
  const onSaveContent = (data: GuitarSongLayoutBlockContentUpdate) => hook.updateLayoutBlockContent(block.id, data);
  if (canManage) {
    return (
      <>
        <SongEditableBlockTitle block={block} defaultTitle={t('guitarSong.detail.chords')} canEdit={canManage} onSave={onSaveTitle} />
        <div style={{ marginTop: '12px' }}>
          <SongChordDiagramPrefs
            diagramStyle={song.chord_diagram_style} diagramSize={song.chord_diagram_size} onSave={hook.updateSongFields}
          />
        </div>
        <SongFormChordsSection
          chords={chords}
          diagramStyle={song.chord_diagram_style}
          diagramSize={song.chord_diagram_size}
          canManage={canManage}
          onSave={onSaveContent}
        />
      </>
    );
  }
  if (chords.length === 0) return null;
  return (
    <>
      <SongEditableBlockTitle block={block} defaultTitle={t('guitarSong.detail.chords')} canEdit={canEdit} onSave={onSaveTitle} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
        {chords.map((blockChord, index) => (
          <SongChordRow
            key={blockChord.chord_id}
            songChord={blockChord}
            isFirst={index === 0}
            isLast={index === chords.length - 1}
            canEdit={canEdit}
            canManage={canManage}
            diagramStyle={song.chord_diagram_style}
            diagramSize={song.chord_diagram_size}
            onMoveUp={() => onSaveContent({ chords: swapAdjacent(chords, index, 'prev').map(toBlockChordInput) })}
            onMoveDown={() => onSaveContent({ chords: swapAdjacent(chords, index, 'next').map(toBlockChordInput) })}
            onRemove={() => onSaveContent({ chords: chords.filter((_, i) => i !== index).map(toBlockChordInput) })}
            onCommentBlur={(comment) => onSaveContent({
              chords: chords.map((c, i) => (i === index ? { ...c, comment: comment || null } : c)).map(toBlockChordInput),
            })}
          />
        ))}
      </div>
    </>
  );
};

// The lyrics/chords display settings -- these apply to the song's every "Lyrics & Chords" block
// at once (they're song-level fields), which is exactly why they live in their own "Partagé"
// (Shared) tab of the edit popup rather than in this one block's own "Contenu" tab. The block's
// own title is NOT shared (each "Lyrics & Chords" block has its own), so it lives in that
// "Contenu" tab instead -- see renderSectionsEditorContent.
export const renderSectionsSharedFields = (
  song: GuitarSongDetail, hook: ReturnType<typeof useGuitarSong>,
): React.ReactNode => (
  <SongLyricsPresentationPrefs
    lineSpacingPx={song.lyrics_line_spacing_px}
    textSizePx={song.lyrics_text_size_px}
    chordSizePx={song.lyrics_chord_size_px}
    onSave={hook.updateSongFields}
  />
);

// This block's own part -- its lyrics/chords content, independent of every other "Lyrics &
// Chords" block in the song. Its title lives in the separate "Titre" tab instead -- see
// renderSectionsTitleFields.
export const renderSectionsEditorContent = (
  block: GuitarSongLayoutBlock, song: GuitarSongDetail, hook: ReturnType<typeof useGuitarSong>,
): React.ReactNode => {
  const sectionsBlocks = findBlocksOfType(song.layout.rows, 'sections');

  // A bare block (no lyrics_text yet, no link) shows the one-time setup picker instead of an editor.
  if (block.lyrics_text === null && !block.linked_to_block_id) {
    const linkableBlocks = sectionsBlocks.filter(
      (candidate) => candidate.id !== block.id && !candidate.linked_to_block_id && candidate.lyrics_text !== null,
    );
    return (
      <SongLyricsBlockSetup
        linkableBlocks={linkableBlocks}
        onStartLyrics={() => hook.updateBlockLyrics(block.id, '')}
        onLink={(linkedToBlockId) => hook.linkBlockTo(block.id, linkedToBlockId)}
      />
    );
  }

  const linkTarget = block.linked_to_block_id
    ? sectionsBlocks.find((candidate) => candidate.id === block.linked_to_block_id)
    : undefined;

  return (
    <SongLyricsBlockEditor
      block={block}
      linkTarget={linkTarget}
      diagramStyle={song.chord_diagram_style}
      diagramSize={song.chord_diagram_size}
      textSizePx={song.lyrics_text_size_px}
      chordSizePx={song.lyrics_chord_size_px}
      songChords={song.chords.map((songChord) => songChord.chord)}
      onSaveLyrics={(text) => hook.updateBlockLyrics(block.id, text)}
      onSetWordChord={(lineIndex, wordIndex, position, data) =>
        hook.setWordChord(block.id, lineIndex, wordIndex, position, data)}
    />
  );
};

// Grouped into its own "Titre" tab since it's neither part of the actual lyrics/chords content,
// nor a song-wide shared setting.
export const renderSectionsTitleFields = (
  block: GuitarSongLayoutBlock, t: (key: string) => string, onSaveTitle: (customTitle: string | null) => Promise<void>,
): React.ReactNode => (
  <SongEditableBlockTitle
    block={block} defaultTitle="" canEdit onSave={onSaveTitle}
    placeholder={t('guitarSong.layout.blockTitlePlaceholder')}
  />
);

export const renderSectionsBlock = (
  block: GuitarSongLayoutBlock, song: GuitarSongDetail, canManage: boolean, hook: ReturnType<typeof useGuitarSong>,
  t: (key: string) => string, onSaveTitle: (customTitle: string | null) => Promise<void>,
): React.ReactNode => {
  if (canManage) {
    return (
      <>
        {renderSectionsTitleFields(block, t, onSaveTitle)}
        {renderSectionsSharedFields(song, hook)}
        {renderSectionsEditorContent(block, song, hook)}
      </>
    );
  }
  // A block that links to another already carries the target's lyrics_text/lyrics_words
  // directly (resolved server-side, see layout/service.py) -- block itself is always the right
  // thing to render, whether or not it's a link.
  if (block.lyrics_text === null) return null;
  return (
    <>
      <SongEditableBlockTitle block={block} defaultTitle="" canEdit={false} onSave={onSaveTitle} />
      <SongLyricsBlockReadView
        block={block}
        diagramStyle={song.chord_diagram_style}
        diagramSize={song.chord_diagram_size}
        lineSpacingPx={song.lyrics_line_spacing_px}
        textSizePx={song.lyrics_text_size_px}
        chordSizePx={song.lyrics_chord_size_px}
      />
    </>
  );
};

export const renderVideosBlock = (
  block: GuitarSongLayoutBlock, song: GuitarSongDetail, canEdit: boolean, canManage: boolean,
  hook: ReturnType<typeof useGuitarSong>, t: (key: string) => string, onSaveTitle: (customTitle: string | null) => Promise<void>,
): React.ReactNode => {
  if (!canEdit && song.videos.length === 0) return null;
  if (canEdit) {
    return (
      <>
        <SongEditableBlockTitle block={block} defaultTitle={t('guitarSong.videos.title')} canEdit={canManage} onSave={onSaveTitle} />
        <SongFormVideosSection
          videos={song.videos} canManage={canManage}
          onAdd={hook.addVideo} onUpdate={hook.updateVideo} onMove={hook.moveVideo} onRemove={hook.removeVideo}
        />
      </>
    );
  }
  return (
    <>
      <SongEditableBlockTitle block={block} defaultTitle={t('guitarSong.videos.title')} canEdit={false} onSave={onSaveTitle} />
      <SongVideoList
        videos={song.videos} canEdit={false} canManage={false}
        onAdd={hook.addVideo} onUpdate={hook.updateVideo} onMove={hook.moveVideo} onRemove={hook.removeVideo}
      />
    </>
  );
};

export const renderLabelsBlock = (
  block: GuitarSongLayoutBlock, song: GuitarSongDetail, canManage: boolean, hook: ReturnType<typeof useGuitarSong>,
  labelsHook: ReturnType<typeof useGuitarSongLabels>, onSaveTitle: (customTitle: string | null) => Promise<void>,
): React.ReactNode => {
  if (!canManage) {
    return (
      <>
        <SongEditableBlockTitle block={block} defaultTitle="" canEdit={false} onSave={onSaveTitle} />
        <SongLabelChips labels={labelsHook.labels} labelIds={song.label_ids} />
      </>
    );
  }
  return (
    <>
      <SongEditableBlockTitle block={block} defaultTitle="" canEdit={canManage} onSave={onSaveTitle} />
      <SongFormLabelsSection
        labels={labelsHook.labels}
        attachedLabelIds={song.label_ids}
        canManage={canManage}
        onToggle={(labelId) => hook.toggleLabel(labelId, song.label_ids.includes(labelId))}
        onCreate={labelsHook.createLabel}
        onUpdate={labelsHook.updateLabel}
        onDelete={labelsHook.deleteLabel}
      />
    </>
  );
};

export const renderChordGridBlock = (
  block: GuitarSongLayoutBlock, song: GuitarSongDetail, canManage: boolean, hook: ReturnType<typeof useGuitarSong>,
  t: (key: string) => string, onSaveTitle: (customTitle: string | null) => Promise<void>,
): React.ReactNode => {
  const rows = block.chord_grid_rows ?? [];
  const canAddChord = findBlocksOfType(song.layout.rows, 'chords').length > 0;
  const onSaveContent = (data: GuitarSongLayoutBlockContentUpdate) => hook.updateLayoutBlockContent(block.id, data);

  if (canManage) {
    return (
      <>
        <SongEditableBlockTitle block={block} defaultTitle={t('guitarSong.detail.chordGrid')} canEdit={canManage} onSave={onSaveTitle} />
        <SongFormChordGridSection
          rows={rows} songChords={song.chords} diagramStyle={song.chord_diagram_style}
          chordSizePx={block.chord_grid_chord_size_px} canAddChord={canAddChord}
          onSave={onSaveContent}
        />
        <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ marginTop: '8px' }}>
          <EditorJoditComponent
            content={block.custom_content_html ?? ''}
            onChange={(value) => onSaveContent({ custom_content_html: value })}
            compact minHeight={100}
          />
        </div>
      </>
    );
  }
  if (rows.length === 0 && isBlankHtml(block.custom_content_html)) return null;
  return (
    <>
      <SongEditableBlockTitle block={block} defaultTitle={t('guitarSong.detail.chordGrid')} canEdit={false} onSave={onSaveTitle} />
      <SongChordGridBlock
        rows={rows} songChords={song.chords} comment={block.custom_content_html}
        diagramStyle={song.chord_diagram_style} diagramSize={song.chord_diagram_size}
        chordSizePx={block.chord_grid_chord_size_px}
      />
    </>
  );
};
