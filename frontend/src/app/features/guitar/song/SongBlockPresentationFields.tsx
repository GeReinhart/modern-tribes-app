import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { ALL_ALIGNS, alignIcon, alignLabel, isTitleEditableBlockType } from './layoutBlockOptions.ts';
import * as layoutMutations from './layoutMutations.ts';
import { SongInlineEditableNumber } from './SongInlineEditableField.tsx';
import { SongTitleHeadingLevelPicker } from './SongTitleHeadingLevelPicker.tsx';
import { GuitarSongLayoutBlock, GuitarSongLayoutColumn, GuitarSongLayoutRow } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

const hasEditableTitle = (blockType: GuitarSongLayoutBlock['block_type']): boolean =>
  blockType === 'custom' || isTitleEditableBlockType(blockType);

// Laid out in a cross around a center, matching the side each field actually affects -- the
// short label ("Haut", "Gauche"...) only needs to name the side, since its position already
// shows it; the full sentence (with the "(mm)" unit) still goes in the aria-label/tooltip. Shared
// by a block's own padding and a column's padding around all of its blocks -- both have the
// exact same 4 field names, just on different objects.
type PaddingFieldName = 'padding_top_mm' | 'padding_right_mm' | 'padding_bottom_mm' | 'padding_left_mm';
interface WithPadding {
  padding_top_mm: number;
  padding_right_mm: number;
  padding_bottom_mm: number;
  padding_left_mm: number;
}

const PADDING_FIELDS: Array<{
  field: PaddingFieldName;
  ariaLabelKey: string;
  shortLabelKey: string;
  gridColumn: number;
  gridRow: number;
}> = [
  { field: 'padding_top_mm', ariaLabelKey: 'guitarSong.layout.paddingTop', shortLabelKey: 'guitarSong.layout.paddingTopShort', gridColumn: 2, gridRow: 1 },
  { field: 'padding_left_mm', ariaLabelKey: 'guitarSong.layout.paddingLeft', shortLabelKey: 'guitarSong.layout.paddingLeftShort', gridColumn: 1, gridRow: 2 },
  { field: 'padding_right_mm', ariaLabelKey: 'guitarSong.layout.paddingRight', shortLabelKey: 'guitarSong.layout.paddingRightShort', gridColumn: 3, gridRow: 2 },
  { field: 'padding_bottom_mm', ariaLabelKey: 'guitarSong.layout.paddingBottom', shortLabelKey: 'guitarSong.layout.paddingBottomShort', gridColumn: 2, gridRow: 3 },
];

interface PaddingFieldsGridProps {
  titleKey: string;
  value: WithPadding;
  onUpdate: (patch: Partial<WithPadding>) => Promise<void>;
}

// The shared 4-field cross grid itself, used both for a block's own padding and a column's
// padding around all of its blocks.
const PaddingFieldsGrid: React.FC<PaddingFieldsGridProps> = ({ titleKey, value, onUpdate }) => {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <ThemedText size="small">{t(titleKey)}</ThemedText>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: '4px', justifyContent: 'center' }}>
        {PADDING_FIELDS.map(({ field, ariaLabelKey, shortLabelKey, gridColumn, gridRow }) => (
          <div key={field} style={{ gridColumn, gridRow }}>
            <SongInlineEditableNumber
              min={0} max={100} value={value[field]}
              onSave={(fieldValue) => onUpdate({ [field]: fieldValue })}
              ariaLabel={t(ariaLabelKey)} label={t(shortLabelKey)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

interface BlockPresentationFieldsProps {
  row: GuitarSongLayoutRow;
  columnId: string;
  columnWidthTwelfths: number;
  blockIndex: number;
  block: GuitarSongLayoutBlock;
  hook: ReturnType<typeof useGuitarSong>;
}

// Every field here applies immediately -- on click, or on blur for a number field -- and the
// popup never closes on its own, exactly like every other field in the block editor's other
// tabs. It lives in a modal (not a dismiss-on-outside-click popover), so committing on blur is
// safe: focus already leaves the field, and the value is saved, before any click elsewhere
// (including the modal's own close button) can discard it.
export const BlockPresentationFields: React.FC<BlockPresentationFieldsProps> = ({
  row, columnId, columnWidthTwelfths, blockIndex, block, hook,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const updateBlock = (patch: Parameters<typeof layoutMutations.updateBlockPresentation>[3]) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.updateBlockPresentation(latestRow, columnId, blockIndex, patch));

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SongInlineEditableNumber
          value={block.zoom_percent} min={30} max={200}
          ariaLabel={t('guitarSong.layout.blockZoom')} label={t('guitarSong.layout.blockZoom')}
          onSave={(zoom_percent) => updateBlock({ zoom_percent })}
        />
        <div style={{ backgroundColor: block.show_card ? `${theme.colors.primary}25` : 'transparent', borderRadius: 'var(--radius-md)' }}>
          <ThemedIconButton
            action={{ icon: 'credit-card', label: t('guitarSong.layout.blockShowCard'), onClick: () => updateBlock({ show_card: !block.show_card }) }}
          />
        </div>
        <SongInlineEditableNumber
          value={Math.min(block.width_twelfths, columnWidthTwelfths)} min={1} max={columnWidthTwelfths}
          ariaLabel={t('guitarSong.layout.customBlockWidth', { max: columnWidthTwelfths })}
          label={t('guitarSong.layout.customBlockWidth', { max: columnWidthTwelfths })}
          onSave={(width_twelfths) => updateBlock({ width_twelfths })}
        />
        {hasEditableTitle(block.block_type) && (
          <SongTitleHeadingLevelPicker
            value={block.title_heading_level} ariaLabelPrefix={t('guitarSong.layout.titleHeadingLevel')}
            onChange={(title_heading_level) => updateBlock({ title_heading_level })}
          />
        )}
      </div>
      <div style={{ borderLeft: `1px solid ${theme.colors.border}`, paddingLeft: '20px' }}>
        <PaddingFieldsGrid titleKey="guitarSong.layout.blockMarginsTitle" value={block} onUpdate={updateBlock} />
      </div>
    </div>
  );
};

interface ColumnPresentationFieldsProps {
  row: GuitarSongLayoutRow;
  column: GuitarSongLayoutColumn;
  hook: ReturnType<typeof useGuitarSong>;
}

// Every field here applies immediately -- on click, or on blur for a padding field -- and the
// popover never closes on its own, same as every field in a block's own Presentation tab.
// ThemedPopover never closes on an outside click (only via its trigger or its own close button,
// both of which are focusable and so blur the field first), so nothing typed can be silently
// discarded by dismissing the popover.
export const ColumnPresentationFields: React.FC<ColumnPresentationFieldsProps> = ({ row, column, hook }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const updateColumn = (patch: Parameters<typeof layoutMutations.updateColumnPresentation>[2]) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.updateColumnPresentation(latestRow, column.id, patch));
  const resizeWidth = (delta: number) =>
    hook.replaceLayoutRow(row.id, (latestRow) => layoutMutations.resizeColumnWidth(latestRow, column.id, delta));

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
        <span style={{ fontSize: '12px' }}>{column.width_twelfths}/12</span>
        <ThemedIconButton action={{ icon: 'chevron-up', label: t('guitarSong.layout.widthWider'), onClick: () => resizeWidth(1) }} />
      </div>
      <PaddingFieldsGrid titleKey="guitarSong.layout.columnMarginsTitle" value={column} onUpdate={updateColumn} />
    </>
  );
};
