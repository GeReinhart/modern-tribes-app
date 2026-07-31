import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { ROOT_NOTE_OPTIONS } from './fretOptions.ts';

interface ChordsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  rootFilter: string;
  onRootFilterChange: (value: string) => void;
  onAdd: () => void;
}

export const ChordsFilterBar: React.FC<ChordsFilterBarProps> = ({
  search,
  onSearchChange,
  rootFilter,
  onRootFilterChange,
  onAdd,
}) => {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div style={{ minWidth: '200px', flex: 1 }}>
        <ThemedInput
          label={t('guitarChords.list.search')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('guitarChords.list.searchPlaceholder')}
        />
      </div>
      <div style={{ minWidth: '140px' }}>
        <ThemedSelect
          label={t('guitarChords.list.root')}
          options={ROOT_NOTE_OPTIONS}
          value={rootFilter}
          allowEmpty
          placeholder={t('guitarChords.list.allRoots')}
          onChange={onRootFilterChange}
        />
      </div>
      <ThemedButton onClick={onAdd} fullWidth={false}>
        {t('guitarChords.list.add')}
      </ThemedButton>
    </div>
  );
};
