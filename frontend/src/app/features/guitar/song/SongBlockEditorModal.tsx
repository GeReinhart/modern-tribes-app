import { ModalBody, ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BlockPresentationFields } from './SongBlockPresentationFields.tsx';
import { blockTypeLabel } from './layoutBlockOptions.ts';
import { renderBlockContent } from './songLayoutBlockContentDispatch.tsx';
import { renderSectionsEditorContent, renderSectionsSharedFields, renderSectionsTitleFields } from './songLayoutCollectionBlocks.tsx';
import { GuitarSongDetail, GuitarSongLayoutBlock, GuitarSongLayoutRow, LAYOUT_ROW_WIDTH_TWELFTHS } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';

type EditorTab = 'content' | 'title' | 'shared' | 'presentation';

interface SongBlockEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: GuitarSongLayoutBlock;
  row: GuitarSongLayoutRow;
  columnId: string;
  blockIndex: number;
  song: GuitarSongDetail;
  labelsHook: ReturnType<typeof useGuitarSongLabels>;
  canEdit: boolean;
  canManage: boolean;
  hook: ReturnType<typeof useGuitarSong>;
  onSaveTitle: (customTitle: string | null) => Promise<void>;
}

// Content edits (chords, sections, videos, labels, chord grid, rich text) save immediately and
// keep the modal open, since none of them replace the row -- only presentation edits (zoom,
// card, title size, width) do that, so those are drafted and applied once via an explicit Save
// that also closes the modal (see BlockPresentationFields).
export const SongBlockEditorModal: React.FC<SongBlockEditorModalProps> = ({
  isOpen, onClose, block, row, columnId, blockIndex, song, labelsHook, canEdit, canManage, hook, onSaveTitle,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [tab, setTab] = useState<EditorTab>('content');
  const column = row.columns.find((c) => c.id === columnId);
  // A "Lyrics & Chords" block gets 2 extra tabs no other block type has: its own title gets a
  // "Titre" tab (see renderSectionsTitleFields), and the lyrics/chords display settings (line
  // spacing, text size, chord size) -- song-level, applying to every "Lyrics & Chords" block at
  // once -- get their own "Partagé" (Shared) tab, instead of either living inside this one
  // block's own content.
  const isSectionsBlock = block.block_type === 'sections';

  const tabButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
    background: active ? `${theme.colors.primary}20` : 'transparent',
    color: active ? theme.colors.primary : theme.colors.text, fontWeight: active ? 600 : 400,
  });

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={blockTypeLabel(t, block.block_type)} size="xl">
      <ModalBody>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {isSectionsBlock && (
            <button type="button" style={tabButtonStyle(tab === 'title')} onClick={() => setTab('title')}>
              {t('guitarSong.layout.blockTitleTab')}
            </button>
          )}
          <button type="button" style={tabButtonStyle(tab === 'content')} onClick={() => setTab('content')}>
            {t('guitarSong.layout.blockContentTab')}
          </button>
          {isSectionsBlock && (
            <button type="button" style={tabButtonStyle(tab === 'shared')} onClick={() => setTab('shared')}>
              {t('guitarSong.layout.blockSharedTab')}
            </button>
          )}
          <button type="button" style={tabButtonStyle(tab === 'presentation')} onClick={() => setTab('presentation')}>
            {t('guitarSong.layout.blockPresentationTab')}
          </button>
        </div>
        {tab === 'content' && (
          isSectionsBlock
            ? renderSectionsEditorContent(block, song, hook)
            : renderBlockContent(block, song, labelsHook, canEdit, canManage, hook, theme, t, onSaveTitle)
        )}
        {tab === 'title' && isSectionsBlock && renderSectionsTitleFields(block, t, onSaveTitle)}
        {tab === 'shared' && isSectionsBlock && renderSectionsSharedFields(song, hook)}
        {tab === 'presentation' && (
          <BlockPresentationFields
            row={row} columnId={columnId} columnWidthTwelfths={column?.width_twelfths ?? LAYOUT_ROW_WIDTH_TWELFTHS}
            blockIndex={blockIndex} block={block} hook={hook}
          />
        )}
      </ModalBody>
    </ThemedModal>
  );
};
