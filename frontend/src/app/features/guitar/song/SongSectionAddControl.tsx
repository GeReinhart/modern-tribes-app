import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GuitarSongSection, GuitarSongSectionCreate, SectionContentMode } from './types.ts';

interface SongSectionAddControlProps {
  typeSuggestions: string[];
  allSections: GuitarSongSection[];
  onAdd: (data: GuitarSongSectionCreate) => Promise<void>;
}

export const SongSectionAddControl: React.FC<SongSectionAddControlProps> = ({ typeSuggestions, allSections, onAdd }) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [typeLabel, setTypeLabel] = useState('');
  const [contentMode, setContentMode] = useState<SectionContentMode>('lyrics');
  // Only a "root" section (not itself a link) can be linked to -- no chains.
  const [linkedToSectionId, setLinkedToSectionId] = useState('');
  const [adding, setAdding] = useState(false);

  const contentModeOptions = [
    { value: 'lyrics', label: t('guitarSong.sections.modeLyrics') },
    { value: 'chords_only', label: t('guitarSong.sections.modeChordsOnly') },
  ];
  const linkableSections = allSections.filter((section) => !section.linked_to_section_id);

  const handleAdd = async () => {
    if (!typeLabel.trim()) return;
    setAdding(true);
    try {
      await onAdd({
        type_label: typeLabel.trim(), content_mode: contentMode,
        linked_to_section_id: linkedToSectionId || undefined,
      });
      setTypeLabel('');
      setLinkedToSectionId('');
      setExpanded(false);
    } finally {
      setAdding(false);
    }
  };

  // Collapsed behind its own trigger rather than always showing the empty form inline -- an
  // always-visible blank "type/content" form reads as a leftover empty section you forgot to
  // remove, not as the control that lets you add one.
  if (!expanded) {
    return (
      <ThemedButton onClick={() => setExpanded(true)} fullWidth={false} leftIcon={<ThemedSvgIcon name="plus" color="white" size={16} />}>
        {t('guitarSong.sections.add')}
      </ThemedButton>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div>
        <ThemedInput
          label={t('guitarSong.sections.typeLabel')}
          value={typeLabel}
          onChange={(e) => setTypeLabel(e.target.value)}
          list="new-section-type-suggestions"
          autoFocus
        />
        <datalist id="new-section-type-suggestions">
          {typeSuggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
        </datalist>
      </div>
      {linkedToSectionId ? (
        <div style={{ minWidth: '160px' }}>
          <ThemedInput label={t('guitarSong.sections.contentMode')} value={t('guitarSong.sections.linkedContentNote')} disabled />
        </div>
      ) : (
        <ThemedSelect
          label={t('guitarSong.sections.contentMode')}
          options={contentModeOptions}
          value={contentMode}
          allowEmpty={false}
          onChange={(value) => setContentMode(value as SectionContentMode)}
        />
      )}
      {linkableSections.length > 0 && (
        <div style={{ minWidth: '200px' }}>
          <ThemedSelect
            label={t('guitarSong.sections.linkToExisting')}
            options={linkableSections.map((section) => ({ value: section.id, label: section.display_label }))}
            value={linkedToSectionId}
            onChange={setLinkedToSectionId}
            placeholder={t('guitarSong.sections.linkToExistingNone')}
            allowEmpty
          />
        </div>
      )}
      <ThemedButton onClick={handleAdd} disabled={!typeLabel.trim()} isLoading={adding} fullWidth={false}>
        {t('guitarSong.sections.add')}
      </ThemedButton>
      <ThemedButton onClick={() => setExpanded(false)} variant="ghost" fullWidth={false}>
        {t('common.cancel')}
      </ThemedButton>
    </div>
  );
};
