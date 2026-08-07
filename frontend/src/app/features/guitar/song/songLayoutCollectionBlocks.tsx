import React from 'react';

import { SongChordDiagramPrefs } from './SongChordDiagramPrefs.tsx';
import { SongChordRow } from './SongChordRow.tsx';
import { SongEditableBlockTitle } from './SongEditableBlockTitle.tsx';
import { SongFormChordsSection } from './SongFormChordsSection.tsx';
import { SongFormLabelsSection } from './SongFormLabelsSection.tsx';
import { SongFormSectionsSection } from './SongFormSectionsSection.tsx';
import { SongFormVideosSection } from './SongFormVideosSection.tsx';
import { SongLabelChips } from './SongLabelChips.tsx';
import { SongLyricsPresentationPrefs } from './SongLyricsPresentationPrefs.tsx';
import { SongSectionsBlock } from './SongSectionsBlock.tsx';
import { SongVideoList } from './SongVideoList.tsx';
import { findBlocksOfType } from './layoutBlockOptions.ts';
import { GuitarSongDetail, GuitarSongLayoutBlock, GuitarSongSectionCreate } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';

export const renderChordsBlock = (
  block: GuitarSongLayoutBlock, song: GuitarSongDetail, canEdit: boolean, canManage: boolean,
  hook: ReturnType<typeof useGuitarSong>, t: (key: string) => string, onSaveTitle: (customTitle: string | null) => Promise<void>,
): React.ReactNode => {
  if (canManage) {
    return (
      <>
        <SongEditableBlockTitle block={block} defaultTitle={t('guitarSong.detail.chords')} canEdit={canManage} onSave={onSaveTitle} />
        <SongChordDiagramPrefs
          diagramStyle={song.chord_diagram_style} diagramSize={song.chord_diagram_size} onSave={hook.updateSongFields}
        />
        <SongFormChordsSection
          chords={song.chords}
          diagramStyle={song.chord_diagram_style}
          diagramSize={song.chord_diagram_size}
          canManage={canManage}
          onAddChord={hook.addChord}
          onRemoveChord={hook.removeChord}
        />
      </>
    );
  }
  if (song.chords.length === 0) return null;
  return (
    <>
      <SongEditableBlockTitle block={block} defaultTitle={t('guitarSong.detail.chords')} canEdit={canEdit} onSave={onSaveTitle} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
        {song.chords.map((songChord, index) => (
          <SongChordRow
            key={songChord.id}
            songChord={songChord}
            isFirst={index === 0}
            isLast={index === song.chords.length - 1}
            canEdit={canEdit}
            canManage={canManage}
            diagramStyle={song.chord_diagram_style}
            diagramSize={song.chord_diagram_size}
            onMoveUp={() => hook.moveChord(songChord.id, 'prev')}
            onMoveDown={() => hook.moveChord(songChord.id, 'next')}
            onRemove={() => hook.removeChord(songChord.id)}
            onCommentBlur={(comment) => hook.updateComment(songChord.id, { comment: comment || null })}
          />
        ))}
      </div>
    </>
  );
};

export const renderSectionsBlock = (
  block: GuitarSongLayoutBlock, song: GuitarSongDetail, canManage: boolean, hook: ReturnType<typeof useGuitarSong>,
  t: (key: string) => string, onSaveTitle: (customTitle: string | null) => Promise<void>,
): React.ReactNode => {
  const sectionsBlocks = findBlocksOfType(song.layout.rows, 'sections');
  // An unassigned section always falls back to the FIRST sections block, however many exist --
  // never to "nowhere". Without this, the instant a second block is added, every pre-existing
  // section (unassigned by definition, since this concept didn't exist before) would vanish
  // from both blocks at once, since it matches neither one's id.
  const isFirstSectionsBlock = sectionsBlocks[0]?.id === block.id;
  const visibleSections = song.sections.filter((section) =>
    section.layout_block_id === block.id || (section.layout_block_id === null && isFirstSectionsBlock));
  const addSectionToThisBlock = (data: GuitarSongSectionCreate) => hook.addSection({ ...data, layout_block_id: block.id });

  if (canManage) {
    return (
      <>
        <SongEditableBlockTitle block={block} defaultTitle={t('guitarSong.detail.sections')} canEdit={canManage} onSave={onSaveTitle} />
        <SongLyricsPresentationPrefs
          lineSpacingPx={song.lyrics_line_spacing_px}
          textSizePx={song.lyrics_text_size_px}
          chordSizePx={song.lyrics_chord_size_px}
          onSave={hook.updateSongFields}
        />
        <SongFormSectionsSection
          sections={visibleSections}
          allSections={song.sections}
          sectionsBlocks={sectionsBlocks}
          canManage={canManage}
          diagramStyle={song.chord_diagram_style}
          diagramSize={song.chord_diagram_size}
          songChords={song.chords.map((songChord) => songChord.chord)}
          onAddSection={addSectionToThisBlock}
          onUpdateSection={hook.updateSection}
          onMoveSection={hook.moveSection}
          onRemoveSection={hook.removeSection}
          onDuplicateSection={hook.duplicateSection}
          onSaveLyrics={hook.updateSectionLyrics}
          onSetWordChord={hook.setWordChord}
          onAddChordToSection={hook.addChordToSection}
          onMoveSectionChord={hook.moveSectionChord}
          onRemoveSectionChord={hook.removeSectionChord}
        />
      </>
    );
  }
  if (visibleSections.length === 0) return null;
  return (
    <>
      <SongEditableBlockTitle block={block} defaultTitle={t('guitarSong.detail.sections')} canEdit={false} onSave={onSaveTitle} />
      <SongSectionsBlock
        sections={visibleSections}
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
