import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import ThemedDateSelection from '@/app/platform/core/layout/themes/components/ThemedDateSelection.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedMultiSelect } from '@/app/platform/core/layout/themes/components/ThemedMultiSelect.tsx';
import ThemedTimeSelection from '@/app/platform/core/layout/themes/components/ThemedTimeSelection.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MealCreate, RecipeOption } from './types.ts';

interface Props {
  featureInstanceId: string;
  defaultDate: string;
  recipes: RecipeOption[];
  onClose: () => void;
  onCreate: (data: MealCreate, recipeIds: string[]) => Promise<void>;
}

const CreateMealModal: React.FC<Props> = ({ featureInstanceId, defaultDate, recipes, onClose, onCreate }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:00');
  const [headcount, setHeadcount] = useState('4');
  const [recipeIds, setRecipeIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const headcountValue = Number(headcount);
  const isValid = Number.isInteger(headcountValue) && headcountValue >= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    await onCreate(
      {
        feature_instance_id: featureInstanceId,
        title: title.trim() || undefined,
        start_at: new Date(`${date}T${startTime}`).toISOString(),
        end_at: new Date(`${date}T${endTime}`).toISOString(),
        headcount: headcountValue,
      },
      recipeIds,
    );
    setSubmitting(false);
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={t('features.meals.newMeal')}>
      <form onSubmit={handleSubmit}>
        <ThemedModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ThemedInput
              label={t('features.meals.title')}
              placeholder={t('features.meals.titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            <ThemedDateSelection label={t('features.meals.date')} value={date} onChange={setDate} />
            <div style={{ display: 'flex', gap: '12px' }}>
              <ThemedTimeSelection label={t('features.meals.startTime')} value={startTime} onChange={setStartTime} />
              <ThemedTimeSelection label={t('features.meals.endTime')} value={endTime} onChange={setEndTime} />
            </div>
            <ThemedInput
              label={t('features.meals.headcount')}
              type="number"
              min={0}
              value={headcount}
              onChange={(e) => setHeadcount(e.target.value)}
            />
            <ThemedMultiSelect
              label={t('features.meals.recipes')}
              options={recipes.map((r) => ({ value: r.id, label: r.name }))}
              value={recipeIds}
              onChange={setRecipeIds}
              placeholder={t('features.meals.selectRecipes')}
            />
          </div>
        </ThemedModalBody>
        <ThemedModalFooter>
          <ThemedButton variant="ghost" type="button" onClick={onClose}>
            {t('features.meals.cancel')}
          </ThemedButton>
          <ThemedButton variant="primary" type="submit" isLoading={submitting} disabled={!isValid}>
            {t('features.meals.create')}
          </ThemedButton>
        </ThemedModalFooter>
      </form>
    </ThemedModal>
  );
};

export default CreateMealModal;
