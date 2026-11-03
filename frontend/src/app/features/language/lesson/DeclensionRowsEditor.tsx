import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import LanguageTextInput, { hasSpecialCharacter } from '../shared/LanguageTextInput.tsx';
import { Declension } from '../shared/types.ts';

interface Props {
  declensions: Declension[];
  onChange: (declensions: Declension[]) => void;
  disabled?: boolean;
  // The language the forms are typed in (adds its special-character helper, e.g. German's ß).
  language?: string;
}

// Reused by every column of the word form for its own declensions. When `disabled` (a reused
// existing word, locked for display only), rows render read-only and add/remove controls hide.
const DeclensionRowsEditor: React.FC<Props> = ({ declensions, onChange, disabled = false, language }) => {
  const { t } = useTranslation();

  const updateRow = (index: number, field: keyof Declension, value: string) => {
    onChange(declensions.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };
  const addRow = () => onChange([...declensions, { case_label: '', form: '' }]);
  const removeRow = (index: number) => onChange(declensions.filter((_, i) => i !== index));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <ThemedText size="small" variant="secondary">{t('features.language.declensions')}</ThemedText>
      {declensions.map((row, index) => (
        <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <LanguageTextInput
            label={t('features.language.declensionCase')}
            value={row.case_label}
            disabled={disabled}
            reserveButtonSpace={hasSpecialCharacter(language) && !disabled}
            onValueChange={(caseLabel) => updateRow(index, 'case_label', caseLabel)}
            containerStyle={{ flex: 1 }}
          />
          <LanguageTextInput
            label={t('features.language.declensionForm')}
            value={row.form}
            language={language}
            disabled={disabled}
            onValueChange={(form) => updateRow(index, 'form', form)}
            containerStyle={{ flex: 1 }}
          />
          {!disabled && (
            <ThemedButton variant="ghost" type="button" icon="trash" iconOnly onClick={() => removeRow(index)}>
              {t('features.language.removeDeclension')}
            </ThemedButton>
          )}
        </div>
      ))}
      {!disabled && (
        <ThemedButton
          variant="secondary" type="button" icon="plus" iconOnly fullWidth={false}
          style={{ alignSelf: 'flex-start' }} onClick={addRow}
        >
          {t('features.language.addDeclension')}
        </ThemedButton>
      )}
    </div>
  );
};

export default DeclensionRowsEditor;
