import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { recipesService } from './service.ts';
import { Recipe, RecipeComponentCreate } from './types.ts';

interface Props {
  projectId: string;
  currentRecipeId: string;
  existingComponentIds: string[];
  onClose: () => void;
  onSubmit: (data: RecipeComponentCreate) => Promise<boolean>;
}

const AddRecipeComponentModal: React.FC<Props> = ({
  projectId, currentRecipeId, existingComponentIds, onClose, onSubmit,
}) => {
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [componentRecipeId, setComponentRecipeId] = useState('');
  const [multiplier, setMultiplier] = useState('1');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    recipesService.listByProject(projectId).then(setRecipes).catch(() => undefined);
  }, [projectId]);

  const options = recipes
    .filter((r) => r.id !== currentRecipeId && !existingComponentIds.includes(r.id))
    .map((r) => ({ value: r.id, label: r.name }));

  const multiplierValue = Number(multiplier);
  const isValid = componentRecipeId !== '' && multiplierValue > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    const ok = await onSubmit({ component_recipe_id: componentRecipeId, multiplier: multiplierValue });
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={t('features.recipes.addComponent')}>
      <form onSubmit={handleSubmit}>
        <ThemedModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ThemedSelect
              label={t('features.recipes.componentRecipe')}
              options={options}
              value={componentRecipeId}
              onChange={setComponentRecipeId}
              placeholder={t('features.recipes.selectComponentRecipe')}
              allowEmpty={false}
            />
            <ThemedInput
              label={t('features.recipes.multiplier')}
              helperText={t('features.recipes.multiplierHelp')}
              type="number"
              step="0.5"
              min={0.5}
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
            />
          </div>
        </ThemedModalBody>
        <ThemedModalFooter>
          <ThemedButton variant="ghost" type="button" onClick={onClose}>
            {t('features.recipes.cancel')}
          </ThemedButton>
          <ThemedButton variant="primary" type="submit" isLoading={submitting} disabled={!isValid}>
            {t('features.recipes.add')}
          </ThemedButton>
        </ThemedModalFooter>
      </form>
    </ThemedModal>
  );
};

export default AddRecipeComponentModal;
