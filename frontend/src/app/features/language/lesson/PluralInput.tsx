import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { WordColumnState } from './wordColumn.ts';
import LanguageTextInput from '../shared/LanguageTextInput.tsx';

interface Props {
  value: WordColumnState;
  locked: boolean;
  onChange: (value: WordColumnState) => void;
  // Shown after the field (e.g. the button translating the other column's plural into this one).
  action?: React.ReactNode;
  // Shown under the field (the translation proposals).
  panel?: React.ReactNode;
}

// A noun's plural: one field, with optional translate action and proposals. Used by the learned
// language's detail fields, and alone by the known language's column, where the user types the
// plural that is then translated into the learned language.
const PluralInput: React.FC<Props> = ({ value, locked, onChange, action, panel }) => {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <LanguageTextInput
          label={t('features.language.plural')}
          value={value.plural}
          language={value.language}
          disabled={locked}
          onValueChange={(plural) => onChange({ ...value, plural })}
          containerStyle={{ flex: 1 }}
        />
        {action}
      </div>
      {panel}
    </div>
  );
};

export const PluralTranslateButton: React.FC<{
  disabled: boolean; loading: boolean; onClick: () => void;
}> = ({ disabled, loading, onClick }) => {
  const { t } = useTranslation();
  return (
    <ThemedButton type="button" variant="secondary" fullWidth={false} icon="zap" iconOnly
      isLoading={loading} disabled={disabled} onClick={onClick}>
      {t('features.language.translatePlural')}
    </ThemedButton>
  );
};

export default PluralInput;
