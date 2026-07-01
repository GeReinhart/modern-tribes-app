import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { journalService } from '@/app/features/daily-journal/service.ts';
import type { JournalDashboardEntry } from '@/app/features/daily-journal/types.ts';

interface Props {
  selectedDate: string;
}

const DashboardJournalSection: React.FC<Props> = ({ selectedDate }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [entries, setEntries] = useState<JournalDashboardEntry[]>([]);

  useEffect(() => {
    journalService.listAccessible(selectedDate).then(res => setEntries(res.journals));
  }, [selectedDate]);

  if (entries.length === 0) return null;

  return (
    <div style={{ marginTop: '16px', borderTop: `1px solid ${theme.colors.border}`, paddingTop: '12px' }}>
      <div style={{ fontSize: 'var(--font-xs)', fontWeight: 700, textTransform: 'uppercase', color: theme.colors.secondary, marginBottom: '8px' }}>
        {t('journal.journalEntries')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {entries.map(entry => (
          <div key={entry.feature_instance_id}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: '8px', background: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: theme.colors.text }}>{entry.feature_instance_name}</span>
              <span style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary, marginLeft: '6px' }}>{entry.project_name}</span>
            </div>
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: theme.colors.primary, background: theme.colors.primary + '15', borderRadius: '10px', padding: '2px 8px' }}>
              {t('journal.blockCount', { count: entry.block_count })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardJournalSection;
