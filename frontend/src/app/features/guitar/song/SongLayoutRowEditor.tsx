import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongLayoutColumnEditor } from './SongLayoutColumnEditor.tsx';
import { ALL_BLOCK_TYPES } from './layoutBlockOptions.ts';
import { DraftColumn, draftColumnsToInput, draftColumnsWidthSum, emptyDraftColumn, ROW_WIDTH_EIGHTHS } from './layoutDraft.ts';
import { GuitarSongLayoutRowInput } from './types.ts';

interface SongLayoutRowEditorProps {
  initialColumns: DraftColumn[];
  initialPageBreakBefore: boolean;
  usedElsewhere: Set<string>;
  onDraftChange: (input: GuitarSongLayoutRowInput) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemoveRow?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const nextUnusedBlockType = (columns: DraftColumn[], usedElsewhere: Set<string>) => {
  const used = new Set([...usedElsewhere, ...columns.flatMap((c) => c.blocks.map((b) => b.block_type))]);
  return ALL_BLOCK_TYPES.find((blockType) => !used.has(blockType)) ?? ALL_BLOCK_TYPES[0];
};

export const SongLayoutRowEditor: React.FC<SongLayoutRowEditorProps> = ({
  initialColumns, initialPageBreakBefore, usedElsewhere, onDraftChange,
  onMoveUp, onMoveDown, onRemoveRow, isFirst, isLast,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [columns, setColumns] = useState<DraftColumn[]>(initialColumns);
  const [pageBreakBefore, setPageBreakBefore] = useState(initialPageBreakBefore);

  const widthSum = draftColumnsWidthSum(columns);
  const widthValid = widthSum === ROW_WIDTH_EIGHTHS;

  useEffect(() => {
    onDraftChange(draftColumnsToInput(pageBreakBefore, columns));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageBreakBefore, columns]);

  const updateColumn = (index: number, updated: DraftColumn) =>
    setColumns(columns.map((column, i) => (i === index ? updated : column)));

  const removeColumn = (index: number) => setColumns(columns.filter((_, i) => i !== index));

  const addColumn = () => {
    const remaining = ROW_WIDTH_EIGHTHS - widthSum;
    if (remaining <= 0) return;
    setColumns([...columns, emptyDraftColumn(nextUnusedBlockType(columns, usedElsewhere), remaining)]);
  };

  return (
    <ThemedCard bordered className="p-3">
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px', gap: '2px' }}>
        {onMoveUp && (
          <ThemedIconButton action={{ icon: 'chevron-up', label: t('guitarSong.detail.moveUp'), onClick: onMoveUp, disabled: isFirst }} />
        )}
        {onMoveDown && (
          <ThemedIconButton action={{ icon: 'chevron-down', label: t('guitarSong.detail.moveDown'), onClick: onMoveDown, disabled: isLast }} />
        )}
        {onRemoveRow && (
          <ThemedIconButton action={{ icon: 'trash', label: t('guitarSong.layout.removeRow'), onClick: onRemoveRow, variant: 'danger' }} />
        )}
        <div style={{ backgroundColor: pageBreakBefore ? `${theme.colors.primary}25` : 'transparent', borderRadius: 'var(--radius-md)' }}>
          <ThemedIconButton
            action={{
              icon: 'flag',
              label: t('guitarSong.layout.pageBreakBefore'),
              onClick: () => setPageBreakBefore(!pageBreakBefore),
            }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {columns.map((column, index) => (
          <SongLayoutColumnEditor
            key={column.key}
            column={column}
            usedElsewhere={usedElsewhere}
            canRemove={columns.length > 1}
            onChange={(updated) => updateColumn(index, updated)}
            onRemove={() => removeColumn(index)}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <ThemedButton variant="ghost" fullWidth={false} onClick={addColumn} disabled={widthSum >= ROW_WIDTH_EIGHTHS}>
          {t('guitarSong.layout.addColumn')}
        </ThemedButton>
        {!widthValid && (
          <span style={{ fontSize: '12px', color: 'red' }}>
            {t('guitarSong.layout.widthSumError', { sum: widthSum })}
          </span>
        )}
      </div>
    </ThemedCard>
  );
};
