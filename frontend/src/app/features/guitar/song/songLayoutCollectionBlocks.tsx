import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';

import { SongChordDiagramPrefs } from './SongChordDiagramPrefs.tsx';
import { SongChordRow } from './SongChordRow.tsx';
import { SongFormChordsSection } from './SongFormChordsSection.tsx';
import { SongFormLabelsSection } from './SongFormLabelsSection.tsx';
import { SongFormSectionsSection } from './SongFormSectionsSection.tsx';
import { SongFormVideosSection } from './SongFormVideosSection.tsx';
import { SongLabelChips } from './SongLabelChips.tsx';
import { SongSectionsBlock } from './SongSectionsBlock.tsx';
import { SongVideoList } from './SongVideoList.tsx';
import { GuitarSongDetail } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';

export const renderChordsBlock = (
  song: GuitarSongDetail, canEdit: boolean, canManage: boolean, hook: ReturnType<typeof useGuitarSong>, t: (key: string) => string,
): React.ReactNode => {
  if (canManage) {
    return (
      <>
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
      <ThemedText size="medium" as="h3">{t('guitarSong.detail.chords')}</ThemedText>
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
  song: GuitarSongDetail, canManage: boolean, hook: ReturnType<typeof useGuitarSong>, t: (key: string) => string,
): React.ReactNode => {
  if (canManage) {
    return (
      <SongFormSectionsSection
        sections={song.sections}
        canManage={canManage}
        diagramStyle={song.chord_diagram_style}
        diagramSize={song.chord_diagram_size}
        songChords={song.chords.map((songChord) => songChord.chord)}
        onAddSection={hook.addSection}
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
    );
  }
  if (song.sections.length === 0) return null;
  return (
    <>
      <ThemedText size="medium" as="h3">{t('guitarSong.sections.title')}</ThemedText>
      <SongSectionsBlock sections={song.sections} diagramStyle={song.chord_diagram_style} diagramSize={song.chord_diagram_size} />
    </>
  );
};

export const renderVideosBlock = (
  song: GuitarSongDetail, canEdit: boolean, canManage: boolean, hook: ReturnType<typeof useGuitarSong>, t: (key: string) => string,
): React.ReactNode => {
  if (!canEdit && song.videos.length === 0) return null;
  if (canEdit) {
    return (
      <SongFormVideosSection
        videos={song.videos} canManage={canManage}
        onAdd={hook.addVideo} onUpdate={hook.updateVideo} onMove={hook.moveVideo} onRemove={hook.removeVideo}
      />
    );
  }
  return (
    <>
      <ThemedText size="medium" as="h3">{t('guitarSong.videos.title')}</ThemedText>
      <SongVideoList
        videos={song.videos} canEdit={false} canManage={false}
        onAdd={hook.addVideo} onUpdate={hook.updateVideo} onMove={hook.moveVideo} onRemove={hook.removeVideo}
      />
    </>
  );
};

export const renderLabelsBlock = (
  song: GuitarSongDetail, canManage: boolean, hook: ReturnType<typeof useGuitarSong>, labelsHook: ReturnType<typeof useGuitarSongLabels>,
): React.ReactNode => {
  if (!canManage) return <SongLabelChips labels={labelsHook.labels} labelIds={song.label_ids} />;
  return (
    <SongFormLabelsSection
      labels={labelsHook.labels}
      attachedLabelIds={song.label_ids}
      canManage={canManage}
      onToggle={(labelId) => hook.toggleLabel(labelId, song.label_ids.includes(labelId))}
      onCreate={labelsHook.createLabel}
      onUpdate={labelsHook.updateLabel}
      onDelete={labelsHook.deleteLabel}
    />
  );
};
