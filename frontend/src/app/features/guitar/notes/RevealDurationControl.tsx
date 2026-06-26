import React from 'react';
import { useTranslation } from 'react-i18next';

import StepControl from './StepControl.tsx';

interface Props {
  value: number;
  onChange: (value: number) => void;
}

const RevealDurationControl: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <StepControl
      value={value}
      min={1}
      max={10}
      onChange={onChange}
      label={t('features.guitarNotes.revealDuration')}
      formatValue={(v) => `${v}s`}
    />
  );
};

export default RevealDurationControl;
