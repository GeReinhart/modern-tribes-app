import { ThemedTabs } from '@/app/platform/core/layout/themes/components/ThemedTabs.tsx';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FeatureTabProps } from '@/app/features/glue/registry.ts';
import JournalByLabelTab from './JournalByLabelTab.tsx';
import JournalDayTab from './JournalDayTab.tsx';
import { useJournalDay } from './useJournalDay.ts';

const TODAY = new Date().toISOString().slice(0, 10);

const JournalTab: React.FC<FeatureTabProps> = ({ featureInstanceId }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'day' | 'by-label'>('day');
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [filterLabelId, setFilterLabelId] = useState<string | null>(null);

  const {
    blocks, labels, days,
    createBlock, updateBlock, deleteBlock, reorderBlocks, toggleLabel,
  } = useJournalDay(featureInstanceId, selectedDate);

  const tabs = [
    { key: 'day', label: t('journal.tabDay') },
    { key: 'by-label', label: t('journal.tabByLabel') },
  ];

  return (
    <div>
      <ThemedTabs tabs={tabs} activeTab={activeTab} onTabChange={k => setActiveTab(k as 'day' | 'by-label')} />
      <div style={{ padding: '16px 0' }}>
        {activeTab === 'day' ? (
          <JournalDayTab
            featureInstanceId={featureInstanceId}
            selectedDate={selectedDate}
            blocks={blocks}
            labels={labels}
            days={days}
            filterLabelId={filterLabelId}
            onDateChange={setSelectedDate}
            onFilterLabel={setFilterLabelId}
            onCreateBlock={createBlock}
            onUpdateBlock={updateBlock}
            onDeleteBlock={deleteBlock}
            onReorderBlocks={reorderBlocks}
            onToggleLabel={toggleLabel}
          />
        ) : (
          <JournalByLabelTab featureInstanceId={featureInstanceId} labels={labels} />
        )}
      </div>
    </div>
  );
};

export default JournalTab;
