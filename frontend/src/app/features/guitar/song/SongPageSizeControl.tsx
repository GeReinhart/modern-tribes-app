import { ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { PresentationPageSize } from './usePresentationPageSize.ts';

interface SongPageSizeControlProps {
  pageSize: PresentationPageSize;
  onChange: (value: PresentationPageSize) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SongPageSizeControl: React.FC<SongPageSizeControlProps> = ({ pageSize, onChange, isOpen, onClose }) => {
  const { t } = useTranslation();

  const options = [
    { value: 'a4', label: t('guitarSong.layout.pageSizeA4') },
    { value: 'letter', label: t('guitarSong.layout.pageSizeLetter') },
    { value: 'full', label: t('guitarSong.layout.pageSizeFull') },
  ];

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={t('guitarSong.layout.pageSizeLabel')} size="sm">
      <div style={{ padding: '16px' }}>
        <ThemedSelect
          label={t('guitarSong.layout.pageSizeLabel')}
          options={options}
          value={pageSize}
          onChange={(value) => { onChange(value as PresentationPageSize); onClose(); }}
          allowEmpty={false}
        />
      </div>
    </ThemedModal>
  );
};
