import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongInlineEditableNumber } from './SongInlineEditableField.tsx';
import { ALL_ALIGNS, alignIcon, alignLabel } from './layoutBlockOptions.ts';
import * as layoutMutations from './layoutMutations.ts';
import { GuitarSongLayoutBlock, GuitarSongLayoutColumn, GuitarSongLayoutRow } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';

const PADDING_FIELDS: Array<[keyof GuitarSongLayoutColumn, 'arrow-up' | 'arrow-right' | 'arrow-down' | 'arrow-left', string]> = [
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
}

export const BlockPresentationFields: React.FC<BlockPresentationFieldsProps> = ({
  row, columnId, columnWidthEighths, blockIndex, block, hook,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const updateBlock = (patch: Parameters<typeof layoutMutations.updateBlockPresentation>[3]) =>
    hook.replaceLayoutRow(row.id, layoutMutations.updateBlockPresentation(row, columnId, blockIndex, patch));

  return (
    <>
      <SongInlineEditableNumber
        value={block.zoom_percent} min={30} max={200} ariaLabel={t('guitarSong.layout.blockZoom')} label={t('guitarSong.layout.blockZoom')}
        onSave={(zoom_percent) => updateBlock({ zoom_percent })}
      />
      <div style={{ backgroundColor: block.show_card ? `${theme.colors.primary}25` : 'transparent', borderRadius: 'var(--radius-md)' }}>
        <ThemedIconButton
          action={{ icon: 'credit-card', label: t('guitarSong.layout.blockShowCard'), onClick: () => updateBlock({ show_card: !block.show_card }) }}
        />
      </div>
      <SongInlineEditableNumber
        value={Math.min(block.width_eighths, columnWidthEighths)} min={1} max={columnWidthEighths}
        ariaLabel={t('guitarSong.layout.customBlockWidth', { max: columnWidthEighths })}
        label={t('guitarSong.layout.customBlockWidth', { max: columnWidthEighths })}
        onSave={(width_eighths) => updateBlock({ width_eighths: Math.min(width_eighths, columnWidthEighths) })}
      />
    </>
  );
};

interface ColumnPresentationFieldsProps {
  row: GuitarSongLayoutRow;
  column: GuitarSongLayoutColumn;
  hook: ReturnType<typeof useGuitarSong>;
}

export const ColumnPresentationFields: React.FC<ColumnPresentationFieldsProps> = ({ row, column, hook }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const updateColumn = (patch: Parameters<typeof layoutMutations.updateColumnPresentation>[2]) =>
    hook.replaceLayoutRow(row.id, layoutMutations.updateColumnPresentation(row, column.id, patch));
  const resizeWidth = (delta: number) => hook.replaceLayoutRow(row.id, layoutMutations.resizeColumnWidth(row, column.id, delta));

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
      {PADDING_FIELDS.map(([field, icon, labelKey]) => (
        <SongInlineEditableNumber
          key={field}
          value={column[field] as number} min={0} max={100} ariaLabel={t(labelKey)}
          leftIcon={<ThemedSvgIcon name={icon} color={theme.colors.secondary} size={14} />}
          onSave={(value) => updateColumn({ [field]: value })}
        />
      ))}
    </>
  );
};
