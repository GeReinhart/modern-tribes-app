import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedMultiSelect } from '@/app/platform/core/layout/themes/components/ThemedMultiSelect.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CollapsibleField from './CollapsibleField.tsx';
import { combineDateAndTime } from './mealDateUtils.ts';
import MealScheduleFields from './MealScheduleFields.tsx';
import { MealCreate, PersonOption, RecipeOption } from './types.ts';

interface Props {
  featureInstanceId: string;
  defaultDate: string;
  persons: PersonOption[];
  recipes: RecipeOption[];
  onClose: () => void;
  onCreate: (data: MealCreate, recipeIds: string[], participantIds: string[]) => Promise<void>;
}

const CreateMealModal: React.FC<Props> = ({ featureInstanceId, defaultDate, persons, recipes, onClose, onCreate }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:00');
  const [headcount, setHeadcount] = useState('4');
  const [description, setDescription] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
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
        start_at: combineDateAndTime(date, startTime),
        end_at: combineDateAndTime(date, endTime),
        headcount: headcountValue,
        document_content_html: description || undefined,
      },
      recipeIds,
      participantIds,
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
            <MealScheduleFields
              date={date}
              startTime={startTime}
              endTime={endTime}
              headcount={headcount}
              onDateChange={setDate}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onHeadcountChange={setHeadcount}
            />
            <CollapsibleField label={t('features.meals.description')} defaultExpanded={!!description}>
              <EditorJoditComponent content={description} onChange={setDescription} minHeight={100} minimal />
            </CollapsibleField>
            <CollapsibleField label={t('features.meals.participants')} defaultExpanded={participantIds.length > 0}>
              <ThemedMultiSelect
                options={persons.map((p) => ({ value: p.id, label: p.name }))}
                value={participantIds}
                onChange={setParticipantIds}
                placeholder={t('features.meals.selectParticipants')}
              />
            </CollapsibleField>
            <ThemedMultiSelect
              label={t('features.meals.recipes')}
              options={recipes.map((r) => ({ value: r.id, label: r.name }))}
              value={recipeIds}
              onChange={setRecipeIds}
              placeholder={t('features.meals.selectRecipes')}
              inline
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
