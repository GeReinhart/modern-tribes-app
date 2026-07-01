import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import JournalBlockCard from './JournalBlockCard.tsx';
import JournalDateNavigator from './JournalDateNavigator.tsx';
import JournalInsertButton from './JournalInsertButton.tsx';
import JournalNewBlockForm from './JournalNewBlockForm.tsx';
import type { JournalBlock, JournalLabel } from './types.ts';

interface Props {
  featureInstanceId: string;
  selectedDate: string;
  blocks: JournalBlock[];
  labels: JournalLabel[];
  days: string[];
  filterLabelId: string | null;
  onDateChange: (date: string) => void;
  onFilterLabel: (labelId: string | null) => void;
  onCreateBlock: (position: number, contentHtml: string) => Promise<void>;
  onUpdateBlock: (blockId: string, contentHtml: string) => Promise<void>;
  onDeleteBlock: (blockId: string) => Promise<void>;
  onReorderBlocks: (orderedIds: string[]) => Promise<void>;
  onToggleLabel: (blockId: string, labelId: string) => void;
}

const JournalDayTab: React.FC<Props> = ({
  selectedDate, blocks, labels, days, filterLabelId,
  onDateChange, onFilterLabel,
  onCreateBlock, onUpdateBlock, onDeleteBlock, onReorderBlocks, onToggleLabel,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [insertingAt, setInsertingAt] = useState<number | null>(null);

  const visibleBlocks = filterLabelId
    ? blocks.filter(b => b.label_ids.includes(filterLabelId))
    : blocks;

  const handleInsert = async (position: number, contentHtml: string) => {
    await onCreateBlock(position, contentHtml);
    setInsertingAt(null);
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...blocks.map(b => b.id)];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    await onReorderBlocks(newOrder);
  };

  const handleMoveDown = async (index: number) => {
    if (index === blocks.length - 1) return;
    const newOrder = [...blocks.map(b => b.id)];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    await onReorderBlocks(newOrder);
  };

  return (
    <div>
      <JournalDateNavigator selectedDate={selectedDate} days={days} onSelect={onDateChange} />

      {/* Label filter bar */}
      {labels.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px', alignItems: 'center' }}>
          <button type="button" onClick={() => onFilterLabel(null)}
            style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, border: `1.5px solid ${!filterLabelId ? theme.colors.primary : theme.colors.border}`, background: !filterLabelId ? theme.colors.primary + '22' : 'none', cursor: 'pointer', color: theme.colors.text }}>
            All
          </button>
          {labels.map(l => (
            <button key={l.id} type="button" onClick={() => onFilterLabel(l.id === filterLabelId ? null : l.id)}
              style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, border: `1.5px solid ${filterLabelId === l.id ? l.color : theme.colors.border}`, background: filterLabelId === l.id ? l.color + '22' : 'none', cursor: 'pointer', color: theme.colors.text, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />{l.name}
            </button>
          ))}
        </div>
      )}

      {/* Insert at top */}
      {insertingAt === 0 ? (
        <JournalNewBlockForm onSave={c => handleInsert(0, c)} onCancel={() => setInsertingAt(null)} />
      ) : (
        <JournalInsertButton onInsert={() => setInsertingAt(0)} />
      )}

      {/* Block list */}
      {visibleBlocks.length === 0 && insertingAt === null && (
        <div style={{ textAlign: 'center', padding: '32px 16px', color: theme.colors.secondary, fontSize: 'var(--font-sm)' }}>
          <ThemedSvgIcon name="file-text" color={theme.colors.secondary} size={32} />
          <p style={{ marginTop: '8px' }}>{t('journal.emptyDay')}</p>
        </div>
      )}

      {visibleBlocks.map((block, index) => {
        const globalIndex = blocks.indexOf(block);
        return (
          <React.Fragment key={block.id}>
            <JournalBlockCard
              block={block} labels={labels} canEdit
              isFirst={globalIndex === 0} isLast={globalIndex === blocks.length - 1}
              onMoveUp={() => handleMoveUp(globalIndex)}
              onMoveDown={() => handleMoveDown(globalIndex)}
              onSave={c => onUpdateBlock(block.id, c)}
              onDelete={() => onDeleteBlock(block.id)}
              onToggleLabel={lId => onToggleLabel(block.id, lId)}
            />
            {insertingAt === index + 1 ? (
              <JournalNewBlockForm onSave={c => handleInsert(index + 1, c)} onCancel={() => setInsertingAt(null)} />
            ) : (
              <JournalInsertButton onInsert={() => setInsertingAt(index + 1)} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default JournalDayTab;
