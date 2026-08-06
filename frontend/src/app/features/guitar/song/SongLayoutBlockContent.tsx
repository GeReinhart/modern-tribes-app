import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongBlockMenu } from './SongBlockMenu.tsx';
import { SongFormCustomBlockCard } from './SongFormCustomBlockCard.tsx';
import { SongInlineEditableNumber, SongInlineEditableText } from './SongInlineEditableField.tsx';
import { SongStatCard } from './SongStatCard.tsx';
import { renderChordsBlock, renderLabelsBlock, renderSectionsBlock, renderVideosBlock } from './songLayoutCollectionBlocks.tsx';
import { MAX_BEATS_PER_BAR, MAX_CAPO, MAX_TEMPO_BPM, MIN_BEATS_PER_BAR, MIN_CAPO, MIN_TEMPO_BPM } from './songLimits.ts';
import { GuitarSongDetail, GuitarSongLayoutBlock, GuitarSongLayoutRow } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';

interface SongLayoutBlockContentProps {
  block: GuitarSongLayoutBlock;
  row: GuitarSongLayoutRow;
  columnId: string;
  blockIndex: number;
  openUpward: boolean;
  song: GuitarSongDetail;
  labelsHook: ReturnType<typeof useGuitarSongLabels>;
  canEdit: boolean;
  canManage: boolean;
  hook: ReturnType<typeof useGuitarSong>;
}

const renderScalarBlock = (
  block: GuitarSongLayoutBlock, song: GuitarSongDetail, canEdit: boolean, hook: ReturnType<typeof useGuitarSong>,
  theme: ReturnType<typeof useTheme>['theme'], t: (key: string) => string,
): React.ReactNode => {
  switch (block.block_type) {
    case 'title':
      return canEdit ? (
        <SongInlineEditableText
          value={song.title} maxLength={255} onSave={(title) => hook.updateSongFields({ title })}
          style={{ fontSize: '24px', fontWeight: 700 }}
        />
      ) : <h1 style={{ fontSize: '28px', margin: 0, color: theme.colors.text }}>{song.title}</h1>;

    case 'author':
      return canEdit ? (
        <SongInlineEditableText
          value={song.author ?? ''} maxLength={255} placeholder={t('guitarSong.form.author')}
          onSave={(author) => hook.updateSongFields({ author: author || null })}
        />
      ) : (song.author ? (
        <div style={{ fontSize: '20px', fontWeight: 600, color: theme.colors.primary }}>{song.author}</div>
      ) : null);

    case 'tempo':
      return (
        <SongStatCard icon="activity" label={t('guitarSong.detail.statBpm')} value={song.tempo_bpm}>
          {canEdit && (
            <SongInlineEditableNumber
              value={song.tempo_bpm} min={MIN_TEMPO_BPM} max={MAX_TEMPO_BPM} ariaLabel={t('guitarSong.detail.statBpm')}
              onSave={(tempo_bpm) => hook.updateSongFields({ tempo_bpm })} style={{ width: '76px' }}
            />
          )}
        </SongStatCard>
      );

    case 'time_signature':
      return (
        <SongStatCard icon="hash" label={t('guitarSong.detail.statBeatsPerBar')} value={song.beats_per_bar}>
          {canEdit && (
            <SongInlineEditableNumber
              value={song.beats_per_bar} min={MIN_BEATS_PER_BAR} max={MAX_BEATS_PER_BAR} ariaLabel={t('guitarSong.detail.statBeatsPerBar')}
              onSave={(beats_per_bar) => hook.updateSongFields({ beats_per_bar })} style={{ width: '76px' }}
            />
          )}
        </SongStatCard>
      );

    case 'capo':
      return (
        <SongStatCard icon="lock" label={t('guitarSong.detail.statCapo')} value={song.capo > 0 ? song.capo : '–'}>
          {canEdit && (
            <SongInlineEditableNumber
              value={song.capo} min={MIN_CAPO} max={MAX_CAPO} ariaLabel={t('guitarSong.detail.statCapo')}
              onSave={(capo) => hook.updateSongFields({ capo })} style={{ width: '76px' }}
            />
          )}
        </SongStatCard>
      );

    case 'description':
      if (canEdit) {
        return (
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <EditorJoditComponent
              content={song.description_html} onChange={(description_html) => hook.updateSongFields({ description_html })}
              compact minHeight={150}
            />
          </div>
        );
      }
      return song.description_html ? (
        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: song.description_html }} />
      ) : null;

    case 'custom':
      if (canEdit) return <SongFormCustomBlockCard block={block} onUpdate={(data) => hook.updateLayoutBlockContent(block.id, data)} />;
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

const renderBlockContent = (
  block: GuitarSongLayoutBlock, song: GuitarSongDetail, labelsHook: ReturnType<typeof useGuitarSongLabels>,
  canEdit: boolean, canManage: boolean, hook: ReturnType<typeof useGuitarSong>,
  theme: ReturnType<typeof useTheme>['theme'], t: (key: string) => string,
): React.ReactNode => {
  switch (block.block_type) {
    case 'chords':
      return renderChordsBlock(song, canEdit, canManage, hook, t);
    case 'sections':
      return renderSectionsBlock(song, canManage, hook, t);
    case 'videos':
      return renderVideosBlock(song, canEdit, canManage, hook, t);
    case 'labels':
      return renderLabelsBlock(song, canManage, hook, labelsHook);
    default:
      return renderScalarBlock(block, song, canEdit, hook, theme, t);
  }
};

export const SongLayoutBlockContent: React.FC<SongLayoutBlockContentProps> = ({
  block, row, columnId, blockIndex, openUpward, song, labelsHook, canEdit, canManage, hook,
}) => {
  const themeCtx = useTheme();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const content = renderBlockContent(block, song, labelsHook, canEdit, canManage, hook, themeCtx.theme, t);
  if (content === null) return null;

  // CSS zoom (not transform:scale) reflows the whole subtree at the block's own scale, so the
  // card border and padding scale right along with the content instead of clipping it or
  // leaving empty space around it.
  const inner = block.show_card ? <ThemedCard bordered className="p-4">{content}</ThemedCard> : content;
  const primary = themeCtx.theme.colors.primary;
  return (
    <div
      style={{
        zoom: block.zoom_percent / 100, position: 'relative', borderRadius: 'var(--radius-md)',
        outline: menuOpen ? `3px solid ${primary}` : 'none',
        boxShadow: menuOpen ? `0 0 0 6px ${primary}30` : 'none',
        backgroundColor: menuOpen ? `${primary}10` : 'transparent',
      }}
    >
      {inner}
      {canEdit && (
        <div style={{ position: 'absolute', bottom: '-14px', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
          <SongBlockMenu
            row={row} columnId={columnId} blockIndex={blockIndex} block={block} hook={hook} onOpenChange={setMenuOpen}
            direction={openUpward ? 'up' : 'down'}
          />
        </div>
      )}
    </div>
  );
};
