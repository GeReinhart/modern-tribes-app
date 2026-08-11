import { ThemedIconButton } from '@/app/platform/core/layout/themes/components/ThemedIconButton.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { blockTypeLabel } from './layoutBlockOptions.ts';
import { LayoutBlockType } from './types.ts';

interface SongBlockTypePickerProps {
  options: LayoutBlockType[];
  onAdd: (blockType: LayoutBlockType) => void;
  onAddFreeText: () => void;
  // Overrides the free-text choice's label -- same underlying 'custom' block, but "add block
  // after a given block" reads better as "Bloc vide" than the default "+ Texte libre".
  freeTextLabel?: string;
  // Folds the free-text choice into the same select as the block types, as one more pickable
  // option, instead of showing it as its own separate button below -- "add block after" wants
  // a single dropdown listing every choice (types + "Bloc vide"), not two separate controls.
  freeTextInDropdown?: boolean;
}

// Lets the user explicitly choose which element to add — never auto-picks one — reused by
// "add row", "add column" and "add element" since all three need the same choice.
export const SongBlockTypePicker: React.FC<SongBlockTypePickerProps> = ({
  options, onAdd, onAddFreeText, freeTextLabel, freeTextInDropdown = false,
}) => {
  const { t } = useTranslation();
  const [pending, setPending] = useState('');
  const freeTextChoiceLabel = freeTextLabel ?? t('guitarSong.layout.addCustomBlock');

  const selectOptions = [
    ...options.map((bt) => ({ value: bt, label: blockTypeLabel(t, bt) })),
    ...(freeTextInDropdown ? [{ value: 'custom', label: freeTextChoiceLabel }] : []),
  ];

  const handleAdd = () => {
    if (!pending) return;
    if (pending === 'custom' && freeTextInDropdown) onAddFreeText(); else onAdd(pending as LayoutBlockType);
    setPending('');
  };

  const showSelect = freeTextInDropdown || options.length > 0;

  return (
    <>
      {showSelect && (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <ThemedSelect
              options={selectOptions}
              value={pending}
              onChange={setPending}
              allowEmpty
              placeholder={t('guitarSong.layout.addElementPlaceholder')}
            />
          </div>
          <ThemedIconButton action={{ icon: 'plus', label: t('guitarSong.layout.addElementConfirm'), onClick: handleAdd, disabled: !pending }} />
        </div>
      )}
      {!freeTextInDropdown && (
        <ThemedIconButton action={{ icon: 'file-text', label: freeTextChoiceLabel, onClick: onAddFreeText }} />
      )}
    </>
  );
};
