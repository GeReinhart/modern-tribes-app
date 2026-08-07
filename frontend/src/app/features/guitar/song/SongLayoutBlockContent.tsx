import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongBlockMenu } from './SongBlockMenu.tsx';
import { SongEditableBlockTitle } from './SongEditableBlockTitle.tsx';
import { SongFormCustomBlockCard } from './SongFormCustomBlockCard.tsx';
import { SongInlineEditableNumber, SongInlineEditableText } from './SongInlineEditableField.tsx';
import { SongLayoutMoveButton } from './SongLayoutMoveButton.tsx';
import { SongStatCard } from './SongStatCard.tsx';
import * as layoutMutations from './layoutMutations.ts';
import { TITLE_HEADING_SIZES_PX } from './layoutBlockOptions.ts';
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
  isFirstBlock: boolean;
  isLastBlock: boolean;
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
  onSaveTitle: (customTitle: string | null) => Promise<void>,
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
          <>
            <SongEditableBlockTitle block={block} defaultTitle="" canEdit={canEdit} onSave={onSaveTitle} />
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <EditorJoditComponent
                content={song.description_html} onChange={(description_html) => hook.updateSongFields({ description_html })}
                compact minHeight={150}
              />
            </div>
          </>
        );
      }
      if (!song.description_html && !block.custom_title) return null;
      return (
        <>
          <SongEditableBlockTitle block={block} defaultTitle="" canEdit={false} onSave={onSaveTitle} />
          {song.description_html && (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: song.description_html }} />
          )}
        </>
      );

    case 'custom':
      if (canEdit) return <SongFormCustomBlockCard block={block} onUpdate={(data) => hook.updateLayoutBlockContent(block.id, data)} />;
      return block.custom_title || block.custom_content_html ? (
        <>
          {block.custom_title && (
            <div
              style={{
                fontWeight: 700, color: theme.colors.text, marginBottom: '8px',
                fontSize: `${TITLE_HEADING_SIZES_PX[block.title_heading_level]}px`,
              }}
            >
              {block.custom_title}
            </div>
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
  theme: ReturnType<typeof useTheme>['theme'], t: (key: string) => string, onSaveTitle: (customTitle: string | null) => Promise<void>,
): React.ReactNode => {
  switch (block.block_type) {
    case 'chords':
      return renderChordsBlock(block, song, canEdit, canManage, hook, t, onSaveTitle);
    case 'sections':
      return renderSectionsBlock(block, song, canManage, hook, t, onSaveTitle);
    case 'videos':
      return renderVideosBlock(block, song, canEdit, canManage, hook, t, onSaveTitle);
    case 'labels':
      return renderLabelsBlock(block, song, canManage, hook, labelsHook, onSaveTitle);
    default:
      return renderScalarBlock(block, song, canEdit, hook, theme, t, onSaveTitle);
  }
};

export const SongLayoutBlockContent: React.FC<SongLayoutBlockContentProps> = ({
  block, row, columnId, blockIndex, isFirstBlock, isLastBlock, openUpward, song, labelsHook, canEdit, canManage, hook,
}) => {
  const themeCtx = useTheme();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const saveBlockTitle = (customTitle: string | null) =>
    hook.replaceLayoutRow(row.id, (latestRow) =>
      layoutMutations.updateBlockPresentation(latestRow, columnId, blockIndex, { custom_title: customTitle }));
  const moveBlock = (direction: 'prev' | 'next') =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.moveBlock(latestRow, columnId, blockIndex, direction));

  const content = renderBlockContent(block, song, labelsHook, canEdit, canManage, hook, themeCtx.theme, t, saveBlockTitle);
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
        <div style={{
          position: 'absolute', bottom: '-14px', left: '50%', transform: 'translateX(-50%)', zIndex: 2,
          display: 'flex', alignItems: 'center', gap: '2px',
        }}
        >
          <SongLayoutMoveButton
            icon="arrow-left" label={t('guitarSong.layout.moveBlockLeft')} onClick={() => moveBlock('prev')} disabled={isFirstBlock}
          />
          <SongBlockMenu
            row={row} columnId={columnId} blockIndex={blockIndex} block={block} hook={hook} onOpenChange={setMenuOpen}
            direction={openUpward ? 'up' : 'down'}
          />
          <SongLayoutMoveButton
            icon="arrow-right" label={t('guitarSong.layout.moveBlockRight')} onClick={() => moveBlock('next')} disabled={isLastBlock}
          />
        </div>
      )}
    </div>
  );
};
