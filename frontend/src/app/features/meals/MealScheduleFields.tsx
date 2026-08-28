import ThemedDateSelection from '@/app/platform/core/layout/themes/components/ThemedDateSelection.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import ThemedTimeSelection from '@/app/platform/core/layout/themes/components/ThemedTimeSelection.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import FieldLabel from './FieldLabel.tsx';

interface Props {
  date: string;
  startTime: string;
  endTime: string;
  headcount: string;
  onDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onHeadcountChange: (value: string) => void;
}

// Date, start/end time and headcount as one block, shared by the create and
// edit meal forms so both expose the exact same fields with the same layout.
const MealScheduleFields: React.FC<Props> = ({
  date, startTime, endTime, headcount, onDateChange, onStartTimeChange, onEndTimeChange, onHeadcountChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <ThemedDateSelection label={t('features.meals.date')} value={date} onChange={onDateChange} width="100%" />
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div>
          <FieldLabel>{t('features.meals.startTime')}</FieldLabel>
          <ThemedTimeSelection value={startTime} onChange={onStartTimeChange} />
        </div>
        <div>
          <FieldLabel>{t('features.meals.endTime')}</FieldLabel>
          <ThemedTimeSelection value={endTime} onChange={onEndTimeChange} />
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
