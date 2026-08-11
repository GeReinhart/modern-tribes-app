import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { DIFFICULTY_LEVEL_STYLES } from '../chords/difficultyLevels.ts';
import { MASTERY_LEVEL_STYLES } from './masteryLevels.ts';
import { GuitarSongLabel, GuitarSongState } from './types.ts';

interface SongSearchFiltersProps {
  labels: GuitarSongLabel[];
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  selectedLabelIds: string[];
  onToggleLabel: (labelId: string) => void;
  selectedStates: GuitarSongState[];
  onToggleState: (state: GuitarSongState) => void;
  selectedDifficulties: number[];
  onToggleDifficulty: (value: number) => void;
  selectedMasteries: number[];
  onToggleMastery: (value: number) => void;
  onClearAll: () => void;
}

const STATE_OPTIONS: Array<{ value: GuitarSongState; labelKey: string }> = [
  { value: GuitarSongState.draft, labelKey: 'guitarSong.state.draft' },
  { value: GuitarSongState.completed, labelKey: 'guitarSong.state.completed' },
];

export const SongSearchFilters: React.FC<SongSearchFiltersProps> = ({
  labels, searchInput, onSearchInputChange, selectedLabelIds, onToggleLabel, selectedStates, onToggleState,
  selectedDifficulties, onToggleDifficulty, selectedMasteries, onToggleMastery, onClearAll,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const chipStyle = (active: boolean, color?: string): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px',
    borderRadius: '16px',
    fontSize: 'var(--font-xxs)',
    fontWeight: 500,
    cursor: 'pointer',
    border: `1px solid ${active ? (color || theme.colors.primary) : theme.colors.border}`,
    backgroundColor: active ? `${color || theme.colors.primary}15` : theme.colors.surface,
    color: active ? (color || theme.colors.primary) : theme.colors.secondary,
    whiteSpace: 'nowrap',
  });

  const renderLevelChips = (
    levelLabelKeyPrefix: string,
    styles: typeof DIFFICULTY_LEVEL_STYLES,
    selected: number[],
    onToggle: (value: number) => void,
  ) => styles.map((style) => {
    const active = selected.includes(style.value);
    return (
      <button key={`${levelLabelKeyPrefix}${style.value}`} type="button" style={chipStyle(active, style.color)} onClick={() => onToggle(style.value)}>
        <ThemedSvgIcon name={style.icon} color={active ? style.color : theme.colors.secondary} size={11} />
        {t(`${levelLabelKeyPrefix}${style.value}`)}
      </button>
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <ThemedInput
        value={searchInput}
        onChange={(e) => onSearchInputChange(e.target.value)}
        placeholder={t('guitarSong.list.searchPlaceholder')}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        <button type="button" style={chipStyle(false)} onClick={onClearAll}>
          {t('guitarSong.list.clearFilters')}
        </button>
        {STATE_OPTIONS.map((option) => (
          <button
            key={option.labelKey}
            type="button"
            style={chipStyle(selectedStates.includes(option.value))}
            onClick={() => onToggleState(option.value)}
          >
            {t(option.labelKey)}
          </button>
        ))}
        {renderLevelChips('guitarSong.difficulty.level', DIFFICULTY_LEVEL_STYLES, selectedDifficulties, onToggleDifficulty)}
        {renderLevelChips('guitarSong.mastery.level', MASTERY_LEVEL_STYLES, selectedMasteries, onToggleMastery)}
        {labels.map((label) => (
          <button
            key={label.id}
            type="button"
            style={chipStyle(selectedLabelIds.includes(label.id))}
            onClick={() => onToggleLabel(label.id)}
          >
            {label.name}
          </button>
        ))}
      </div>
    </div>
  );
};
