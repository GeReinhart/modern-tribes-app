import { ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongInlineEditableNumber } from './SongInlineEditableField.tsx';
import { SongIconChoiceButton } from './SongIconChoiceButton.tsx';
import {
  MAX_CUSTOM_PAGE_WIDTH_MM, MIN_CUSTOM_PAGE_WIDTH_MM, PRESET_PAGE_WIDTHS_MM, PresentationPageSize,
} from './usePresentationPageSize.ts';

interface SongPageSizeControlProps {
  pageSize: PresentationPageSize;
  onChange: (value: PresentationPageSize) => void;
  customWidthMm: number;
  onChangeCustomWidthMm: (value: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SongPageSizeControl: React.FC<SongPageSizeControlProps> = ({
  pageSize, onChange, customWidthMm, onChangeCustomWidthMm, isOpen, onClose,
}) => {
  const { t } = useTranslation();

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={t('guitarSong.layout.pageSizeLabel')} size="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <SongIconChoiceButton
            icon="file"
            caption={t('guitarSong.layout.pageSizeA4Caption', { width: PRESET_PAGE_WIDTHS_MM.a4 })}
            ariaLabel={t('guitarSong.layout.pageSizeA4')}
            selected={pageSize === 'a4'}
            onClick={() => onChange('a4')}
          />
          <SongIconChoiceButton
            icon="file-text"
            caption={t('guitarSong.layout.pageSizeLetterCaption', { width: PRESET_PAGE_WIDTHS_MM.letter })}
            ariaLabel={t('guitarSong.layout.pageSizeLetter')}
            selected={pageSize === 'letter'}
            onClick={() => onChange('letter')}
          />
          <SongIconChoiceButton
            icon="maximize"
            caption={t('guitarSong.layout.pageSizeFull')}
            ariaLabel={t('guitarSong.layout.pageSizeFull')}
            selected={pageSize === 'full'}
            onClick={() => onChange('full')}
          />
          <SongIconChoiceButton
            icon="pencil"
            caption={t('guitarSong.layout.pageSizeCustom')}
            ariaLabel={t('guitarSong.layout.pageSizeCustom')}
            selected={pageSize === 'custom'}
            onClick={() => onChange('custom')}
          />
        </div>
        {pageSize === 'custom' && (
          <SongInlineEditableNumber
            value={customWidthMm} min={MIN_CUSTOM_PAGE_WIDTH_MM} max={MAX_CUSTOM_PAGE_WIDTH_MM}
            ariaLabel={t('guitarSong.layout.pageSizeCustomWidthLabel')} label={t('guitarSong.layout.pageSizeCustomWidthLabel')}
            onSave={async (value) => onChangeCustomWidthMm(value)}
          />
        )}
      </div>
    </ThemedModal>
  );
};
