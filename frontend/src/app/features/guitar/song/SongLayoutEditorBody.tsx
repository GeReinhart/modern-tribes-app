import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongLayoutMarginsForm, MarginsDraft } from './SongLayoutMarginsForm.tsx';
import { SongLayoutRowEditor } from './SongLayoutRowEditor.tsx';
import { ALL_BLOCK_TYPES } from './layoutBlockOptions.ts';
import { draftColumnsFromRow, emptyDraftColumn, ROW_WIDTH_EIGHTHS } from './layoutDraft.ts';
import { GuitarSongDetail, GuitarSongLayoutRow, GuitarSongLayoutRowInput } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useSongPdfDownload } from './useSongPdfDownload.ts';

interface SongLayoutEditorBodyProps {
  song: GuitarSongDetail;
  hook: ReturnType<typeof useGuitarSong>;
}

const usedBlockTypes = (rows: GuitarSongLayoutRow[], excludeRowId?: string): Set<string> =>
  new Set(
    rows
      .filter((row) => row.id !== excludeRowId)
      .flatMap((row) => row.columns.flatMap((column) => column.blocks.map((block) => block.block_type))),
  );

const isRowInputValid = (input: GuitarSongLayoutRowInput): boolean =>
  input.columns.reduce((sum, column) => sum + column.width_eighths, 0) === ROW_WIDTH_EIGHTHS;

const marginsDraftFromSettings = (song: GuitarSongDetail): MarginsDraft => ({
  margin_top_mm: song.layout.settings.margin_top_mm,
  margin_right_mm: song.layout.settings.margin_right_mm,
  margin_bottom_mm: song.layout.settings.margin_bottom_mm,
  margin_left_mm: song.layout.settings.margin_left_mm,
});

export const SongLayoutEditorBody: React.FC<SongLayoutEditorBodyProps> = ({ song, hook }) => {
  const { t } = useTranslation();
  const [addingRow, setAddingRow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [marginsDraft, setMarginsDraft] = useState<MarginsDraft>(() => marginsDraftFromSettings(song));
  const [rowDrafts, setRowDrafts] = useState<Record<string, GuitarSongLayoutRowInput>>({});
  const [newRowDraft, setNewRowDraft] = useState<GuitarSongLayoutRowInput | null>(null);
  const { download: downloadPdf, downloading: downloadingPdf } = useSongPdfDownload(song.id, song.title);

  const sortedRows = [...song.layout.rows].sort((a, b) => a.position - b.position);
  const allUsed = usedBlockTypes(song.layout.rows);
  const nextBlockType = ALL_BLOCK_TYPES.find((blockType) => !allUsed.has(blockType)) ?? ALL_BLOCK_TYPES[0];

  const allDrafts = [...Object.values(rowDrafts), ...(addingRow && newRowDraft ? [newRowDraft] : [])];
  const canSave = allDrafts.every(isRowInputValid);

  const handleGlobalSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const pending: Promise<unknown>[] = [hook.updateLayoutSettings(marginsDraft)];
      for (const [rowId, input] of Object.entries(rowDrafts)) {
        pending.push(hook.replaceLayoutRow(rowId, input));
      }
      if (addingRow && newRowDraft) {
        pending.push(hook.addLayoutRow(newRowDraft));
      }
      await Promise.all(pending);
      await hook.reload();
      setAddingRow(false);
      setNewRowDraft(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <ThemedButton fullWidth={false} onClick={downloadPdf} isLoading={downloadingPdf}>
          {t('guitarSong.layout.downloadPdf')}
        </ThemedButton>
        <ThemedButton fullWidth={false} onClick={handleGlobalSave} disabled={!canSave} isLoading={saving}>
          {t('guitarSong.layout.save')}
        </ThemedButton>
      </div>
      <SongLayoutMarginsForm value={marginsDraft} onChange={setMarginsDraft} />
      <ThemedText size="medium" as="h3">{t('guitarSong.layout.rows')}</ThemedText>
      {sortedRows.map((row, index) => (
        <SongLayoutRowEditor
          key={row.id}
          initialColumns={draftColumnsFromRow(row)}
          initialPageBreakBefore={row.page_break_before}
          usedElsewhere={usedBlockTypes(song.layout.rows, row.id)}
          onDraftChange={(input) => setRowDrafts((prev) => ({ ...prev, [row.id]: input }))}
          onMoveUp={() => hook.moveLayoutRow(row.id, 'prev')}
          onMoveDown={() => hook.moveLayoutRow(row.id, 'next')}
          onRemoveRow={() => hook.removeLayoutRow(row.id)}
          isFirst={index === 0}
          isLast={index === sortedRows.length - 1}
        />
      ))}
      {addingRow ? (
        <SongLayoutRowEditor
          initialColumns={[emptyDraftColumn(nextBlockType, ROW_WIDTH_EIGHTHS)]}
          initialPageBreakBefore={false}
          usedElsewhere={allUsed}
          onDraftChange={setNewRowDraft}
        />
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <ThemedIconButton action={{ icon: 'plus', label: t('guitarSong.layout.addRow'), onClick: () => setAddingRow(true) }} />
        </div>
      )}
    </div>
  );
};
