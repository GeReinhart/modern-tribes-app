import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCard } from '@/app/platform/core/layout/themes/components/ThemedCard.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { ThemedText } from '@/app/platform/core/layout/themes/components/ThemedText.tsx';
import { SelectOption } from '@/app/platform/core/common.types.ts';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useLanguages } from '../shared/useLanguages.ts';

interface Props {
  error: string | null;
  onSubmit: (sourceLanguage: string, targetLanguage: string) => Promise<boolean>;
}

const LanguagePairSetupForm: React.FC<Props> = ({ error, onSubmit }) => {
  const { t } = useTranslation();
  const { languages, loading: languagesLoading, error: languagesError } = useLanguages();
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const options: SelectOption[] = languages.map((language) => ({ value: language.code, label: language.name }));
  const isValid = Boolean(source) && Boolean(target) && source !== target;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    await onSubmit(source, target);
    setSubmitting(false);
  };

  return (
    <ThemedCard>
      <ThemedText as="h3" size="medium">{t('features.language.setupTitle')}</ThemedText>
      <ThemedText variant="secondary" size="small">{t('features.language.setupHelp')}</ThemedText>
      {languagesLoading ? (
        <ThemedLoadingSpinner size="sm" />
      ) : (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px', alignItems: 'flex-end' }}>
          <ThemedSelect
            label={t('features.language.sourceLanguage')}
            options={options}
            value={source}
            allowEmpty={false}
            onChange={setSource}
          />
          <ThemedSelect
            label={t('features.language.targetLanguage')}
            options={options.filter((o) => o.value !== source)}
            value={target}
            allowEmpty={false}
            onChange={setTarget}
          />
          <ThemedButton onClick={handleSubmit} disabled={!isValid} isLoading={submitting} fullWidth={false}>
            {t('features.language.setupSubmit')}
          </ThemedButton>
        </div>
      )}
      {(error || languagesError) && <ThemedText variant="danger" size="small">{error || languagesError}</ThemedText>}
    </ThemedCard>
  );
};

export default LanguagePairSetupForm;
