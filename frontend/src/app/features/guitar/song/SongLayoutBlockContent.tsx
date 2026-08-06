import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongChordRow } from './SongChordRow.tsx';
import { SongLabelChips } from './SongLabelChips.tsx';
import { SongMetronomeControls } from './SongMetronomeControls.tsx';
import { SongSectionsBlock } from './SongSectionsBlock.tsx';
import { SongStatCard } from './SongStatCard.tsx';
import { SongVideoList } from './SongVideoList.tsx';
import { GuitarSongDetail, GuitarSongLabel, GuitarSongLayoutBlock } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

interface SongLayoutBlockContentProps {
  block: GuitarSongLayoutBlock;
  song: GuitarSongDetail;
  labels: GuitarSongLabel[];
  chordsEditable: boolean;
  chordsManageable: boolean;
  hook: ReturnType<typeof useGuitarSong>;
}

const renderBlockContent = (
  block: GuitarSongLayoutBlock, song: GuitarSongDetail, labels: GuitarSongLabel[],
  chordsEditable: boolean, chordsManageable: boolean, hook: ReturnType<typeof useGuitarSong>,
  theme: ReturnType<typeof useTheme>['theme'], t: ReturnType<typeof useTranslation>['t'],
): React.ReactNode => {
  switch (block.block_type) {
    case 'title':
      return <h1 style={{ fontSize: '28px', margin: 0, color: theme.colors.text }}>{song.title}</h1>;

    case 'author':
      return song.author ? (
        <div style={{ fontSize: '20px', fontWeight: 600, color: theme.colors.primary }}>{song.author}</div>
      ) : null;

    case 'tempo':
      return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <SongStatCard icon="activity" label={t('guitarSong.detail.statBpm')} value={song.tempo_bpm} />
          <SongMetronomeControls tempoBpm={song.tempo_bpm} beatsPerBar={song.beats_per_bar} />
        </div>
      );

    case 'time_signature':
      return <SongStatCard icon="hash" label={t('guitarSong.detail.statBeatsPerBar')} value={song.beats_per_bar} />;

    case 'capo':
      return <SongStatCard icon="lock" label={t('guitarSong.detail.statCapo')} value={song.capo > 0 ? song.capo : '–'} />;

    case 'description':
      return song.description_html ? (
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: song.description_html }} />
      ) : null;

    case 'chords':
      return song.chords.length === 0 ? null : (
        <>
          <ThemedText size="medium" as="h3">{t('guitarSong.detail.chords')}</ThemedText>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
            {song.chords.map((songChord, index) => (
              <SongChordRow
                key={songChord.id}
                songChord={songChord}
                isFirst={index === 0}
                isLast={index === song.chords.length - 1}
                canEdit={chordsEditable}
                canManage={chordsManageable}
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

    case 'sections':
      return song.sections.length === 0 ? null : (
        <>
          <ThemedText size="medium" as="h3">{t('guitarSong.sections.title')}</ThemedText>
          <SongSectionsBlock
            sections={song.sections}
            diagramStyle={song.chord_diagram_style}
            diagramSize={song.chord_diagram_size}
          />
        </>
      );

    case 'videos':
      return song.videos.length === 0 ? null : (
        <>
          <ThemedText size="medium" as="h3">{t('guitarSong.videos.title')}</ThemedText>
          <SongVideoList
            videos={song.videos}
            canEdit={false}
            canManage={false}
            onAdd={hook.addVideo}
            onUpdate={hook.updateVideo}
            onMove={hook.moveVideo}
            onRemove={hook.removeVideo}
          />
        </>
      );

    case 'labels':
      return <SongLabelChips labels={labels} labelIds={song.label_ids} />;

    case 'custom':
      return block.custom_title || block.custom_content_html ? (
        <>
          {block.custom_title && (
            <div style={{ fontWeight: 600, color: theme.colors.text, marginBottom: '8px' }}>{block.custom_title}</div>
          )}
          {block.custom_content_html && (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: block.custom_content_html }} />
          )}
        </>
      ) : null;

    default:
      return null;
  }
};

export const SongLayoutBlockContent: React.FC<SongLayoutBlockContentProps> = ({
  block, song, labels, chordsEditable, chordsManageable, hook,
}) => {
  const themeCtx = useTheme();
  const { t } = useTranslation();

  const content = renderBlockContent(block, song, labels, chordsEditable, chordsManageable, hook, themeCtx.theme, t);
  if (content === null) return null;

  // CSS zoom (not transform:scale) reflows the whole subtree at the block's own scale, so the
  // card border and padding scale right along with the content instead of clipping it or
  // leaving empty space around it.
  const inner = block.show_card ? <ThemedCard bordered className="p-4">{content}</ThemedCard> : content;
  return <div style={{ zoom: block.zoom_percent / 100 }}>{inner}</div>;
};
