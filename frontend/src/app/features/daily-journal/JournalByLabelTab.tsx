import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { journalService } from './service.ts';
import JournalBlockCard from './JournalBlockCard.tsx';
import type { JournalBlock, JournalLabel } from './types.ts';

interface Props {
  featureInstanceId: string;
  labels: JournalLabel[];
}

function formatDayHeader(dateStr: string, lang: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US';
  return d.toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

const JournalByLabelTab: React.FC<Props> = ({ featureInstanceId, labels }) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<JournalBlock[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedLabelId) { setBlocks([]); return; }
    setLoading(true);
    journalService.listBlocksByLabel(featureInstanceId, selectedLabelId)
      .then(setBlocks)
      .finally(() => setLoading(false));
  }, [featureInstanceId, selectedLabelId]);

  const blocksByDate = blocks.reduce<Record<string, JournalBlock[]>>((acc, b) => {
    (acc[b.date] = acc[b.date] ?? []).push(b);
    return acc;
  }, {});
  const sortedDates = Object.keys(blocksByDate).sort().reverse();

  return (
    <div>
      {/* Label selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px', alignItems: 'center' }}>
        {labels.length === 0 ? (
          <span style={{ color: theme.colors.secondary, fontSize: 'var(--font-sm)' }}>{t('journal.noLabel')}</span>
        ) : labels.map(l => (
          <button key={l.id} type="button" onClick={() => setSelectedLabelId(l.id === selectedLabelId ? null : l.id)}
            style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, border: `1.5px solid ${selectedLabelId === l.id ? l.color : theme.colors.border}`, background: selectedLabelId === l.id ? l.color : 'none', color: selectedLabelId === l.id ? '#fff' : theme.colors.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedLabelId === l.id ? '#fff' : l.color, flexShrink: 0 }} />{l.name}
          </button>
        ))}
      </div>

      {/* Blocks grouped by date */}
      {loading && <div style={{ color: theme.colors.secondary, fontSize: 'var(--font-sm)' }}>...</div>}
      {!loading && selectedLabelId && sortedDates.length === 0 && (
        <div style={{ color: theme.colors.secondary, fontSize: 'var(--font-sm)', textAlign: 'center', padding: '32px' }}>{t('journal.emptyDay')}</div>
      )}
      {sortedDates.map(dateStr => (
        <div key={dateStr} style={{ marginBottom: '24px' }}>
          <h3 style={{ fontWeight: 700, fontSize: 'var(--font-md)', color: theme.colors.text, textTransform: 'capitalize', marginBottom: '10px', borderBottom: `1px solid ${theme.colors.border}`, paddingBottom: '6px' }}>
            {formatDayHeader(dateStr, i18n.language)}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {blocksByDate[dateStr].map(block => (
              <JournalBlockCard
                key={block.id}
                block={block}
                labels={labels}
                canEdit={false}
                isFirst
                isLast
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                onSave={async () => {}}
                onDelete={async () => {}}
                onToggleLabel={() => {}}
                onCreateLabel={async () => {}}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default JournalByLabelTab;
