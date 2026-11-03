import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { SelectOption } from '@/app/platform/core/common.types.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

import DeclensionRowsEditor from './DeclensionRowsEditor.tsx';
import PluralInput from './PluralInput.tsx';
import { WordColumnState } from './wordColumn.ts';
import { WORD_TYPES, WordType } from '../shared/types.ts';

interface Props {
  value: WordColumnState;
  locked: boolean;
  onChange: (value: WordColumnState) => void;
  pluralAction?: React.ReactNode;
  pluralPanel?: React.ReactNode;
}

// The extra facts of the language being learned: type, plural (nouns only -- other parts of
// speech have none) and declensions. The known language's card never shows these.
const WordDetailFields: React.FC<Props> = ({ value, locked, onChange, pluralAction, pluralPanel }) => {
  const { t } = useTranslation();
  const typeOptions: SelectOption[] = WORD_TYPES.map((wt) => ({ value: wt, label: t(`features.language.wordType.${wt}`) }));

  return (
    <>
      <div style={{ width: 'calc(50% - 4px)' }}>
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
        <PluralInput value={value} locked={locked} onChange={onChange} action={pluralAction} panel={pluralPanel} />
      )}
      <DeclensionRowsEditor language={value.language} declensions={value.declensions} disabled={locked} onChange={(declensions) => onChange({ ...value, declensions })} />
    </>
  );
};

export default WordDetailFields;
