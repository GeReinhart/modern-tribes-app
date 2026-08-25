import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RecipeCreate } from './types.ts';

interface Props {
  featureInstanceId: string;
  onClose: () => void;
  onCreate: (data: RecipeCreate) => Promise<void>;
}

const CreateRecipeModal: React.FC<Props> = ({ featureInstanceId, onClose, onCreate }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [servings, setServings] = useState('4');
  const [submitting, setSubmitting] = useState(false);

  const servingsValue = Number(servings);
  const isValid = name.trim().length > 0 && Number.isInteger(servingsValue) && servingsValue > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    await onCreate({ feature_instance_id: featureInstanceId, name: name.trim(), servings: servingsValue });
    setSubmitting(false);
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={t('features.recipes.newRecipe')}>
      <form onSubmit={handleSubmit}>
        <ThemedModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ThemedInput
              label={t('features.recipes.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('features.recipes.namePlaceholder')}
              autoFocus
            />
            <ThemedInput
              label={t('features.recipes.servings')}
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              min={1}
            />
          </div>
        </ThemedModalBody>
        <ThemedModalFooter>
          <ThemedButton variant="ghost" type="button" onClick={onClose}>
            {t('features.recipes.cancel')}
          </ThemedButton>
          <ThemedButton variant="primary" type="submit" isLoading={submitting} disabled={!isValid}>
            {t('features.recipes.create')}
          </ThemedButton>
        </ThemedModalFooter>
      </form>
    </ThemedModal>
  );
};

export default CreateRecipeModal;
