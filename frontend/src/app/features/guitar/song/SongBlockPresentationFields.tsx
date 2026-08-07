import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ALL_ALIGNS, alignIcon, alignLabel, isTitleEditableBlockType } from './layoutBlockOptions.ts';
import * as layoutMutations from './layoutMutations.ts';
import { SongTitleHeadingLevelPicker } from './SongTitleHeadingLevelPicker.tsx';
import { GuitarSongLayoutBlock, GuitarSongLayoutColumn, GuitarSongLayoutRow } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

const hasEditableTitle = (blockType: GuitarSongLayoutBlock['block_type']): boolean =>
  blockType === 'custom' || isTitleEditableBlockType(blockType);

// A distinct icon per side, PLUS a visible text label on each field (not just a tooltip) -- an
// icon alone, whether one shared icon or four different ones, isn't reliably enough to tell
// four cramped fields apart; the label removes any doubt regardless of the icon.
const PADDING_FIELDS: Array<[keyof GuitarSongLayoutColumn, IconName, string]> = [
  ['padding_top_mm', 'arrow-up', 'guitarSong.layout.paddingTop'],
  ['padding_right_mm', 'arrow-right', 'guitarSong.layout.paddingRight'],
  ['padding_bottom_mm', 'arrow-down', 'guitarSong.layout.paddingBottom'],
  ['padding_left_mm', 'arrow-left', 'guitarSong.layout.paddingLeft'],
];

interface BlockPresentationFieldsProps {
  row: GuitarSongLayoutRow;
  columnId: string;
  columnWidthEighths: number;
  blockIndex: number;
  block: GuitarSongLayoutBlock;
  hook: ReturnType<typeof useGuitarSong>;
  onRequestClose: () => void;
}

// Zoom and width only take effect once explicitly saved -- relying on blur-to-commit meant a
// value typed then dismissed straight from the popover's own close button (rather than tabbing
// or clicking elsewhere first) could be discarded silently.
export const BlockPresentationFields: React.FC<BlockPresentationFieldsProps> = ({
  row, columnId, columnWidthEighths, blockIndex, block, hook, onRequestClose,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const maxWidth = Math.min(block.width_eighths, columnWidthEighths);
  const [zoomDraft, setZoomDraft] = useState(block.zoom_percent);
  const [widthDraft, setWidthDraft] = useState(maxWidth);
  useEffect(() => setZoomDraft(block.zoom_percent), [block.zoom_percent]);
  useEffect(() => setWidthDraft(maxWidth), [maxWidth]);

  const updateBlock = (patch: Parameters<typeof layoutMutations.updateBlockPresentation>[3]) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.updateBlockPresentation(latestRow, columnId, blockIndex, patch));

  const handleSave = () => {
    updateBlock({ zoom_percent: zoomDraft, width_eighths: Math.min(widthDraft, columnWidthEighths) });
    onRequestClose();
  };

  return (
    <>
      <ThemedInput
        type="number" min={30} max={200} value={zoomDraft} onChange={(e) => setZoomDraft(Number(e.target.value))}
        aria-label={t('guitarSong.layout.blockZoom')} title={t('guitarSong.layout.blockZoom')} label={t('guitarSong.layout.blockZoom')}
      />
      <div style={{ backgroundColor: block.show_card ? `${theme.colors.primary}25` : 'transparent', borderRadius: 'var(--radius-md)' }}>
        <ThemedIconButton
          action={{ icon: 'credit-card', label: t('guitarSong.layout.blockShowCard'), onClick: () => updateBlock({ show_card: !block.show_card }) }}
        />
      </div>
      <ThemedInput
        type="number" min={1} max={columnWidthEighths} value={widthDraft} onChange={(e) => setWidthDraft(Number(e.target.value))}
        aria-label={t('guitarSong.layout.customBlockWidth', { max: columnWidthEighths })}
        title={t('guitarSong.layout.customBlockWidth', { max: columnWidthEighths })}
        label={t('guitarSong.layout.customBlockWidth', { max: columnWidthEighths })}
      />
      {hasEditableTitle(block.block_type) && (
        <SongTitleHeadingLevelPicker
          value={block.title_heading_level} ariaLabelPrefix={t('guitarSong.layout.titleHeadingLevel')}
          onChange={(title_heading_level) => updateBlock({ title_heading_level })}
        />
      )}
      <ThemedIconButton action={{ icon: 'save', label: t('guitarSong.layout.save'), onClick: handleSave }} />
    </>
  );
};

interface ColumnPresentationFieldsProps {
  row: GuitarSongLayoutRow;
  column: GuitarSongLayoutColumn;
  hook: ReturnType<typeof useGuitarSong>;
  onRequestClose: () => void;
}

type PaddingDraft = Pick<
  GuitarSongLayoutColumn, 'padding_top_mm' | 'padding_right_mm' | 'padding_bottom_mm' | 'padding_left_mm'
>;

const paddingDraftFromColumn = (column: GuitarSongLayoutColumn): PaddingDraft => ({
  padding_top_mm: column.padding_top_mm, padding_right_mm: column.padding_right_mm,
  padding_bottom_mm: column.padding_bottom_mm, padding_left_mm: column.padding_left_mm,
});

// Padding only takes effect once explicitly saved -- relying on blur-to-commit meant a value
// typed then dismissed straight from the popover's own close button (rather than tabbing or
// clicking elsewhere first) could be discarded silently, which is exactly what was reported.
export const ColumnPresentationFields: React.FC<ColumnPresentationFieldsProps> = ({ row, column, hook, onRequestClose }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [paddingDraft, setPaddingDraft] = useState<PaddingDraft>(() => paddingDraftFromColumn(column));
  useEffect(() => setPaddingDraft(paddingDraftFromColumn(column)), [column]);

  const updateColumn = (patch: Parameters<typeof layoutMutations.updateColumnPresentation>[2]) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.updateColumnPresentation(latestRow, column.id, patch));
  const resizeWidth = (delta: number) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.resizeColumnWidth(latestRow, column.id, delta));
  const handleSavePadding = () => {
    updateColumn(paddingDraft);
    onRequestClose();
  };

  return (
    <>
      <div style={{ display: 'flex', gap: '2px' }}>
        {ALL_ALIGNS.map((align) => (
          <div key={align} style={{ backgroundColor: column.align === align ? `${theme.colors.primary}25` : 'transparent', borderRadius: 'var(--radius-md)' }}>
            <ThemedIconButton action={{ icon: alignIcon(align), label: alignLabel(t, align), onClick: () => updateColumn({ align }) }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        <ThemedIconButton action={{ icon: 'chevron-down', label: t('guitarSong.layout.widthNarrower'), onClick: () => resizeWidth(-1) }} />
        <span style={{ fontSize: '12px' }}>{column.width_eighths}/8</span>
        <ThemedIconButton action={{ icon: 'chevron-up', label: t('guitarSong.layout.widthWider'), onClick: () => resizeWidth(1) }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        {PADDING_FIELDS.map(([field, icon, labelKey]) => (
          <ThemedInput
            key={field}
            type="number" min={0} max={100} value={paddingDraft[field as keyof PaddingDraft]}
            onChange={(e) => setPaddingDraft((draft) => ({ ...draft, [field]: Number(e.target.value) }))}
            aria-label={t(labelKey)} title={t(labelKey)} label={t(labelKey)}
            leftIcon={<ThemedSvgIcon name={icon} color={theme.colors.secondary} size={14} />}
          />
        ))}
      </div>
      <ThemedIconButton action={{ icon: 'save', label: t('guitarSong.layout.save'), onClick: handleSavePadding }} />
    </>
  );
};
