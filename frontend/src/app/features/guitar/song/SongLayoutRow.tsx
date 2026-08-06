import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SongLayoutColumn } from './SongLayoutColumn.tsx';
import { SongRowMenu } from './SongRowMenu.tsx';
import { GuitarSongDetail, GuitarSongLayoutRow as LayoutRow } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import { useGuitarSongLabels } from './useGuitarSongLabels.ts';

interface SongLayoutRowProps {
  row: LayoutRow;
  song: GuitarSongDetail;
  labelsHook: ReturnType<typeof useGuitarSongLabels>;
  canEdit: boolean;
  canManage: boolean;
  hook: ReturnType<typeof useGuitarSong>;
  isFirst: boolean;
  isLast: boolean;
}

export const SongLayoutRow: React.FC<SongLayoutRowProps> = ({
  row, song, labelsHook, canEdit, canManage, hook, isFirst, isLast,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const sortedColumns = [...row.columns].sort((a, b) => a.position - b.position);

  return (
    <>
      {row.page_break_before && <hr className="song-layout-page-break-indicator" />}
      <div
        className={row.page_break_before ? 'song-layout-page-break' : undefined}
        style={{
          width: '100%', marginBottom: '16px', position: 'relative', borderRadius: 'var(--radius-md)',
          border: canEdit ? `1px dotted ${theme.colors.border}` : 'none',
          outline: menuOpen ? `3px solid ${theme.colors.primary}` : 'none',
          boxShadow: menuOpen ? `0 0 0 6px ${theme.colors.primary}30` : 'none',
          backgroundColor: menuOpen ? `${theme.colors.primary}10` : 'transparent',
        }}
      >
        {canEdit && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2px', marginBottom: '4px' }}>
              <ThemedIconButton
                action={{ icon: 'chevron-up', label: t('guitarSong.detail.moveUp'), onClick: () => hook.moveLayoutRow(row.id, 'prev'), disabled: isFirst }}
              />
              <ThemedIconButton
                action={{ icon: 'chevron-down', label: t('guitarSong.detail.moveDown'), onClick: () => hook.moveLayoutRow(row.id, 'next'), disabled: isLast }}
              />
            </div>
            <div style={{ position: 'absolute', left: '-14px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
              <SongRowMenu rows={song.layout.rows} row={row} hook={hook} onOpenChange={setMenuOpen} />
            </div>
          </>
        )}
        <div style={{ display: 'flex', width: '100%' }}>
          {sortedColumns.map((column, index) => (
            <SongLayoutColumn
              key={column.id}
              column={column}
              row={row}
              rows={song.layout.rows}
              isLastRow={isLast}
              isFirstColumn={index === 0}
              isLastColumn={index === sortedColumns.length - 1}
              song={song}
              labelsHook={labelsHook}
              canEdit={canEdit}
              canManage={canManage}
              hook={hook}
            />
          ))}
        </div>
      </div>
    </>
  );
};
