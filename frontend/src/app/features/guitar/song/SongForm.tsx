import { ThemedSubmitButton } from '@/app/platform/core/layout/themes/components/ThemedSubmitButton.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChordDiagramSize, ChordDiagramStyle } from '../chords/ChordDiagram.tsx';
import { SongFormChordsSection } from './SongFormChordsSection.tsx';
import { SongFormCustomBlocksSection } from './SongFormCustomBlocksSection.tsx';
import { SongFormFields } from './SongFormFields.tsx';
import { SongFormLabelsSection } from './SongFormLabelsSection.tsx';
import { SongFormSectionsSection } from './SongFormSectionsSection.tsx';
import { SongFormTemplatePicker } from './SongFormTemplatePicker.tsx';
import { SongFormVideosSection } from './SongFormVideosSection.tsx';
import { GuitarSongCreate, GuitarSongDetail } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongAuthors } from './useGuitarSongAuthors.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';
import { useGuitarSongs } from './useGuitarSongs.ts';

interface SongFormProps {
  song?: GuitarSongDetail;
  projectId: string | null;
  isManager: boolean;
  hook?: ReturnType<typeof useGuitarSong>;
  labelsHook?: ReturnType<typeof useGuitarSongLabels>;
  onSubmit: (data: GuitarSongCreate) => Promise<void>;
  onCancel: () => void;
}

export const SongForm: React.FC<SongFormProps> = ({
  song, projectId, isManager, hook, labelsHook, onSubmit, onCancel,
}) => {
  const { t } = useTranslation();
  const authors = useGuitarSongAuthors(projectId);
  const { songs: existingSongs } = useGuitarSongs(projectId || '');
  const [title, setTitle] = useState(song?.title ?? '');
  const [author, setAuthor] = useState(song?.author ?? '');
  const [tempoBpm, setTempoBpm] = useState(song?.tempo_bpm ?? 120);
  const [beatsPerBar, setBeatsPerBar] = useState(song?.beats_per_bar ?? 4);
  const [capo, setCapo] = useState(song?.capo ?? 0);
  const [diagramStyle, setDiagramStyle] = useState<ChordDiagramStyle>(song?.chord_diagram_style ?? 'full');
  const [diagramSize, setDiagramSize] = useState<ChordDiagramSize>(song?.chord_diagram_size ?? 'medium');
  const [descriptionHtml, setDescriptionHtml] = useState(song?.description_html ?? '');
  const [templateSongId, setTemplateSongId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        author: author.trim() || null,
        tempo_bpm: tempoBpm,
        beats_per_bar: beatsPerBar,
        capo,
        chord_diagram_style: diagramStyle,
        chord_diagram_size: diagramSize,
        description_html: descriptionHtml,
        ...(song ? {} : { template_song_id: templateSongId || null }),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {!song && (
        <SongFormTemplatePicker songs={existingSongs} value={templateSongId} onChange={setTemplateSongId} />
      )}
      <SongFormFields
        authors={authors}
        title={title}
        onTitleChange={setTitle}
        author={author}
        onAuthorChange={setAuthor}
        tempoBpm={tempoBpm}
        onTempoBpmChange={setTempoBpm}
        beatsPerBar={beatsPerBar}
        onBeatsPerBarChange={setBeatsPerBar}
        capo={capo}
        onCapoChange={setCapo}
        diagramStyle={diagramStyle}
        onDiagramStyleChange={setDiagramStyle}
        diagramSize={diagramSize}
        onDiagramSizeChange={setDiagramSize}
        descriptionHtml={descriptionHtml}
        onDescriptionHtmlChange={setDescriptionHtml}
      />
      {song && hook && (
        <SongFormChordsSection
          chords={song.chords}
          diagramStyle={song.chord_diagram_style}
          diagramSize={song.chord_diagram_size}
          canManage={isManager}
          onAddChord={hook.addChord}
          onRemoveChord={hook.removeChord}
        />
      )}
      {song && hook && (
        <SongFormSectionsSection
          sections={song.sections}
          canManage={isManager}
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
      )}
      {song && hook && (
        <SongFormVideosSection
          videos={song.videos}
          canManage={isManager}
          onAdd={hook.addVideo}
          onUpdate={hook.updateVideo}
          onMove={hook.moveVideo}
          onRemove={hook.removeVideo}
        />
      )}
      {song && hook && (
        <SongFormCustomBlocksSection layout={song.layout} onUpdateBlock={hook.updateLayoutBlockContent} />
      )}
      {song && hook && labelsHook && (
        <SongFormLabelsSection
          labels={labelsHook.labels}
          attachedLabelIds={song.label_ids}
          canManage={isManager}
          onToggle={(labelId) => hook.toggleLabel(labelId, song.label_ids.includes(labelId))}
          onCreate={labelsHook.createLabel}
          onUpdate={labelsHook.updateLabel}
          onDelete={labelsHook.deleteLabel}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <ThemedSubmitButton type="button" variant="ghost" fullWidth={false} onClick={onCancel}>
          {t('common.cancel')}
        </ThemedSubmitButton>
        <ThemedSubmitButton type="submit" fullWidth={false} isLoading={saving} disabled={!title.trim()}>
          {song ? t('common.update') : t('common.create')}
        </ThemedSubmitButton>
      </div>
    </form>
  );
};
