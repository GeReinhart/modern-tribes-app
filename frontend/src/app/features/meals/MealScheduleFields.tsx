import ThemedDateSelection from '@/app/platform/core/layout/themes/components/ThemedDateSelection.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedLevelPicker } from '@/app/platform/core/layout/themes/components/ThemedLevelPicker.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { IconName } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import FieldLabel from './FieldLabel.tsx';
import { MEAL_SLOTS, MealSlot } from './mealDateUtils.ts';

interface Props {
  date: string;
  slot: MealSlot;
  headcount: string;
  onDateChange: (value: string) => void;
  onSlotChange: (value: MealSlot) => void;
  onHeadcountChange: (value: string) => void;
}

const MEAL_SLOT_ICONS: Record<MealSlot, IconName> = {
  [MealSlot.morning]: 'coffee',
  [MealSlot.midday]: 'sun',
  [MealSlot.evening]: 'moon',
};

// Date, meal slot (matin/midi/soir, each a fixed time window) and headcount as one block,
// shared by the create and edit meal forms so both expose the exact same fields and layout.
const MealScheduleFields: React.FC<Props> = ({
  date, slot, headcount, onDateChange, onSlotChange, onHeadcountChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const slotOptions = MEAL_SLOTS.map((s) => ({
    value: s, icon: MEAL_SLOT_ICONS[s], color: theme.colors.primary, caption: t(`features.meals.slot.${s}`),
  }));

  return (
    <>
      <ThemedDateSelection label={t('features.meals.date')} value={date} onChange={onDateChange} width="100%" />
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div>
          <FieldLabel>{t('features.meals.mealTime')}</FieldLabel>
          <ThemedLevelPicker
            options={slotOptions} value={slot} onChange={onSlotChange}
            ariaLabelPrefix={t('features.meals.mealTime')}
          />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <ThemedInput
            label={t('features.meals.headcount')}
            type="number"
            min={0}
            value={headcount}
            onChange={(e) => onHeadcountChange(e.target.value)}
          />
        </div>
      </div>
    </>
  );
};

export default MealScheduleFields;
