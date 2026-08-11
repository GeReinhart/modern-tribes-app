import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { FretSelectors } from './FretSelectors.tsx';
import { RootNotePicker } from './RootNotePicker.tsx';

interface ChordsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  rootFilter: string;
  onRootFilterChange: (value: string) => void;
  fretFilter: string[];
  onFretFilterChange: (stringIndex: number, value: string) => void;
  onAdd: () => void;
}

export const ChordsFilterBar: React.FC<ChordsFilterBarProps> = ({
  search,
  onSearchChange,
  rootFilter,
  onRootFilterChange,
  fretFilter,
  onFretFilterChange,
  onAdd,
}) => {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ minWidth: '200px', flex: 1 }}>
          <ThemedInput
            label={t('guitarChords.list.search')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('guitarChords.list.searchPlaceholder')}
          />
        </div>
        <ThemedButton onClick={onAdd} fullWidth={false}>
          {t('guitarChords.list.add')}
        </ThemedButton>
      </div>
      <RootNotePicker label={t('guitarChords.list.root')} value={rootFilter} onChange={onRootFilterChange} />
      <div>
        <span className="block text-sm font-medium mb-1">{t('guitarChords.list.fretFilter')}</span>
        <FretSelectors
          frets={fretFilter}
          onChange={onFretFilterChange}
          allowEmpty
          emptyPlaceholder={t('guitarChords.list.anyFret')}
        />
      </div>
    </div>
  );
};
