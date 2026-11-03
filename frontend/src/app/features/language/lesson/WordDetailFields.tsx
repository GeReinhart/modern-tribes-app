import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { SelectOption } from '@/app/platform/core/common.types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

import DeclensionRowsEditor from './DeclensionRowsEditor.tsx';
import { WordColumnState } from './wordColumn.ts';
import LanguageTextInput from '../shared/LanguageTextInput.tsx';
import { WORD_TYPES, WordType } from '../shared/types.ts';

interface Props {
  value: WordColumnState;
  locked: boolean;
  onChange: (value: WordColumnState) => void;
}

// The extra facts of the language being learned: type, plural (nouns only -- other parts of
// speech have none) and declensions. The known language's card never shows these.
const WordDetailFields: React.FC<Props> = ({ value, locked, onChange }) => {
  const { t } = useTranslation();
  const typeOptions: SelectOption[] = WORD_TYPES.map((wt) => ({ value: wt, label: t(`features.language.wordType.${wt}`) }));

  return (
    <>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <ThemedSelect
            label={t('features.language.wordTypeLabel')}
            options={typeOptions}
            value={value.wordType}
            allowEmpty={false}
            disabled={locked}
            onChange={(v) => onChange({ ...value, wordType: v as WordType })}
          />
        </div>
        {value.wordType === 'noun' && (
          <LanguageTextInput
            label={t('features.language.plural')}
            value={value.plural}
            language={value.language}
            disabled={locked}
            onValueChange={(plural) => onChange({ ...value, plural })}
            containerStyle={{ flex: 1 }}
          />
        )}
      </div>
      <DeclensionRowsEditor language={value.language} declensions={value.declensions} disabled={locked} onChange={(declensions) => onChange({ ...value, declensions })} />
    </>
  );
};

export default WordDetailFields;
