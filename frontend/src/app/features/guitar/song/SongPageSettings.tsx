import { ThemedModal } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { SongInlineEditableNumber } from './SongInlineEditableField.tsx';
import { SongIconChoiceButton } from './SongIconChoiceButton.tsx';
import { SongLayoutMarginsForm } from './SongLayoutMarginsForm.tsx';
import { GuitarSongDetail } from './types.ts';
import { useGuitarSong } from './useGuitarSong.ts';
import {
  MAX_CUSTOM_PAGE_WIDTH_MM, MIN_CUSTOM_PAGE_WIDTH_MM, PRESET_PAGE_WIDTHS_MM, PresentationPageSize,
} from './usePresentationPageSize.ts';

interface SongPageSettingsProps {
  song: GuitarSongDetail;
  hook: ReturnType<typeof useGuitarSong>;
  pageSize: PresentationPageSize;
  onChangePageSize: (value: PresentationPageSize) => void;
  customWidthMm: number;
  onChangeCustomWidthMm: (value: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

// Page size and margins both shape the printed/presented page, so they live in one popup instead
// of two -- picking a size and adjusting margins is one continuous task, not two separate ones.
export const SongPageSettings: React.FC<SongPageSettingsProps> = ({
  song, hook, pageSize, onChangePageSize, customWidthMm, onChangeCustomWidthMm, isOpen, onClose,
}) => {
  const { t } = useTranslation();

  return (
    <ThemedModal isOpen={isOpen} onClose={onClose} title={t('guitarSong.layout.pageSettingsLabel')} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
        <div>
          <ThemedText size="medium" as="h3" style={{ marginBottom: '8px' }}>
            {t('guitarSong.layout.pageSizeLabel')}
          </ThemedText>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <SongIconChoiceButton
                icon="file"
                caption={t('guitarSong.layout.pageSizeA4Caption', { width: PRESET_PAGE_WIDTHS_MM.a4 })}
                ariaLabel={t('guitarSong.layout.pageSizeA4')}
                selected={pageSize === 'a4'}
                onClick={() => onChangePageSize('a4')}
              />
              <SongIconChoiceButton
                icon="file-text"
                caption={t('guitarSong.layout.pageSizeLetterCaption', { width: PRESET_PAGE_WIDTHS_MM.letter })}
                ariaLabel={t('guitarSong.layout.pageSizeLetter')}
                selected={pageSize === 'letter'}
                onClick={() => onChangePageSize('letter')}
              />
              <SongIconChoiceButton
                icon="maximize"
                caption={t('guitarSong.layout.pageSizeFull')}
                ariaLabel={t('guitarSong.layout.pageSizeFull')}
                selected={pageSize === 'full'}
                onClick={() => onChangePageSize('full')}
              />
              <SongIconChoiceButton
                icon="pencil"
                caption={t('guitarSong.layout.pageSizeCustom')}
                ariaLabel={t('guitarSong.layout.pageSizeCustom')}
                selected={pageSize === 'custom'}
                onClick={() => onChangePageSize('custom')}
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
        </div>
        <div>
          <ThemedText size="medium" as="h3" style={{ marginBottom: '8px' }}>
            {t('guitarSong.layout.openMarginsMenu')}
          </ThemedText>
          <SongLayoutMarginsForm settings={song.layout.settings} onSave={hook.updateLayoutSettings} />
        </div>
      </div>
    </ThemedModal>
  );
};
