import React from 'react';
import { useTranslation } from 'react-i18next';

import StepControl from './StepControl.tsx';

interface Props {
  value: number;
  onChange: (value: number) => void;
}

const FretCountControl: React.FC<Props> = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <StepControl
      value={value}
      min={12}
      max={22}
      onChange={onChange}
      label={t('features.guitarNotes.fretCount')}
    />
  );
};

export default FretCountControl;
