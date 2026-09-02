import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';

import React from 'react';

import { SongAuthorEditableField } from './SongAuthorEditableField.tsx';
import { SongEditableBlockTitle } from './SongEditableBlockTitle.tsx';
import { SongFormCustomBlockCard } from './SongFormCustomBlockCard.tsx';
import { SongFreeformHtml } from './SongFreeformHtml.tsx';
import { SongInlineEditableNumber, SongInlineEditableText } from './SongInlineEditableField.tsx';
import { SongStatCard } from './SongStatCard.tsx';
import { TITLE_HEADING_SIZES_PX } from './layoutBlockOptions.ts';
import {
  renderChordGridBlock, renderChordsBlock, renderLabelsBlock, renderSectionsBlock,
} from './songLayoutCollectionBlocks.tsx';
import { MAX_BEATS_PER_BAR, MAX_CAPO, MAX_TEMPO_BPM, MIN_BEATS_PER_BAR, MIN_CAPO, MIN_TEMPO_BPM } from './songLimits.ts';
import { GuitarSongDetail, GuitarSongLayoutBlock } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';

// Shared by the page (called with canEdit=canManage=false, so it always renders the same thing
// presentation view/the PDF would) and the block's edit popup (called with the real flags, so it
// renders exactly what the page used to render inline before editing moved into a popup).

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
        <SongAuthorEditableField
          projectId={song.project_id} value={song.author ?? ''}
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
          {song.description_html && <SongFreeformHtml html={song.description_html} />}
        </>
      );

    case 'custom':
      if (canEdit) return <SongFormCustomBlockCard block={block} onUpdate={(data) => hook.updateLayoutBlockContent(block.id, data)} />;
      return block.custom_title || block.custom_content_html ? (
        <>
          {block.custom_title && (
            <div
              style={{
                color: theme.colors.text, marginBottom: '4px',
                fontSize: `${TITLE_HEADING_SIZES_PX[block.title_heading_level]}px`,
                ...(block.title_heading_level === 'h5'
                  ? { fontWeight: 400, fontStyle: 'italic' }
                  : { fontWeight: 700 }),
              }}
            >
              {block.custom_title}
            </div>
          )}
          {block.custom_content_html && <SongFreeformHtml html={block.custom_content_html} />}
        </>
      ) : null;

    default:
      return null;
  }
};

export const renderBlockContent = (
  block: GuitarSongLayoutBlock, song: GuitarSongDetail, labelsHook: ReturnType<typeof useGuitarSongLabels>,
  canEdit: boolean, canManage: boolean, hook: ReturnType<typeof useGuitarSong>,
  theme: ReturnType<typeof useTheme>['theme'], t: (key: string) => string, onSaveTitle: (customTitle: string | null) => Promise<void>,
): React.ReactNode => {
  switch (block.block_type) {
    case 'chords':
      return renderChordsBlock(block, song, canEdit, canManage, hook, t, onSaveTitle);
    case 'sections':
      return renderSectionsBlock(block, song, canManage, hook, t, onSaveTitle);
    case 'labels':
      return renderLabelsBlock(block, song, canManage, hook, labelsHook, onSaveTitle);
    case 'chord_grid':
      return renderChordGridBlock(block, song, canManage, hook, t, onSaveTitle);
    default:
      return renderScalarBlock(block, song, canEdit, hook, theme, t, onSaveTitle);
  }
};
