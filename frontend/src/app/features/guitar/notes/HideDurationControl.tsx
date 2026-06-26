import React from 'react';
import { useTranslation } from 'react-i18next';

import StepControl from './StepControl.tsx';

interface Props {
  value: number;
  onChange: (value: number) => void;
}

const HideDurationControl: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <StepControl
      value={value}
      min={1}
      max={30}
      onChange={onChange}
      label={t('features.guitarNotes.hideDuration')}
      formatValue={(v) => `${v}s`}
    />
  );
};

export default HideDurationControl;
