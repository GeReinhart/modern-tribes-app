import EditorJoditComponent from '@/app/platform/functions/documents/editor/EditorJoditComponent.tsx';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedMultiSelect } from '@/app/platform/core/layout/themes/components/ThemedMultiSelect.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import CollapsibleField from './CollapsibleField.tsx';
import { combineDateAndTime } from './mealDateUtils.ts';
import MealScheduleFields from './MealScheduleFields.tsx';
import { Meal, PersonOption, RecipeOption } from './types.ts';

interface Props {
  meal: Meal;
  persons: PersonOption[];
  recipes: RecipeOption[];
  canEdit: boolean;
  onUpdate: (data: {
    title?: string;
    start_at?: string;
    end_at?: string;
    headcount?: number;
    document_content_html?: string;
  }) => Promise<void>;
  onSetParticipants: (personIds: string[]) => Promise<void>;
  onToggleRecipe: (recipeId: string) => Promise<void>;
  onArchive: () => Promise<void>;
  onClose: () => void;
}

const MealDetailModal: React.FC<Props> = ({
  meal, persons, recipes, canEdit, onUpdate, onSetParticipants, onToggleRecipe, onArchive, onClose,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const editable = canEdit && mode === 'edit';

  const [date, setDate] = useState(meal.start_at.slice(0, 10));
  const [startTime, setStartTime] = useState(meal.start_at.slice(11, 16));
  const [endTime, setEndTime] = useState(meal.end_at.slice(11, 16));
  const [headcount, setHeadcount] = useState(String(meal.headcount));

  const handleDateChange = (value: string) => {
    setDate(value);
    onUpdate({ start_at: combineDateAndTime(value, startTime), end_at: combineDateAndTime(value, endTime) });
  };
  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    onUpdate({ start_at: combineDateAndTime(date, value) });
  };
  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    onUpdate({ end_at: combineDateAndTime(date, value) });
  };
  const handleHeadcountChange = (value: string) => {
    setHeadcount(value);
    const numeric = Number(value);
    if (Number.isInteger(numeric) && numeric >= 0) onUpdate({ headcount: numeric });
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={meal.title || t('features.meals.untitled')}>
      <ThemedModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {editable ? (
            <>
              <ThemedInput
                label={t('features.meals.title')}
                placeholder={t('features.meals.titlePlaceholder')}
                defaultValue={meal.title ?? ''}
                onBlur={(e) => e.target.value.trim() && onUpdate({ title: e.target.value.trim() })}
              />
              <MealScheduleFields
                date={date}
                startTime={startTime}
                endTime={endTime}
                headcount={headcount}
                onDateChange={handleDateChange}
                onStartTimeChange={handleStartTimeChange}
                onEndTimeChange={handleEndTimeChange}
                onHeadcountChange={handleHeadcountChange}
              />
            </>
          ) : (
            <div>{t('features.meals.headcountValue', { count: meal.headcount })}</div>
          )}

          {(editable || meal.document_content_html) && (
            <CollapsibleField label={t('features.meals.description')} defaultExpanded={!!meal.document_content_html}>
              {editable ? (
                <EditorJoditComponent
                  content={meal.document_content_html || ''}
                  onChange={(content) => onUpdate({ document_content_html: content })}
                  minHeight={100}
                  minimal
                />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: meal.document_content_html || '' }} />
              )}
            </CollapsibleField>
          )}

          <CollapsibleField label={t('features.meals.participants')} defaultExpanded={meal.participant_ids.length > 0}>
            <ThemedMultiSelect
              options={persons.map((p) => ({ value: p.id, label: p.name }))}
              value={meal.participant_ids}
              onChange={onSetParticipants}
              disabled={!editable}
              placeholder={t('features.meals.selectParticipants')}
            />
          </CollapsibleField>

          <div>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('features.meals.recipes')}</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {recipes.length === 0 && (
                <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
                  {t('features.meals.noRecipes')}
                </span>
              )}
              {recipes.map((recipe) => {
                const linked = meal.recipe_ids.includes(recipe.id);
                if (!editable && !linked) return null;
                return (
                  <button
                    key={recipe.id}
                    type="button"
                    disabled={!editable}
                    onClick={() => onToggleRecipe(recipe.id)}
                    style={{
                      border: `1px solid ${theme.colors.border}`,
                      background: linked ? theme.colors.primary : 'transparent',
                      color: linked ? '#fff' : theme.colors.text,
                      borderRadius: '10px',
                      padding: '2px 10px',
                      fontSize: 'var(--font-xs)',
                      cursor: editable ? 'pointer' : 'default',
                    }}
                  >
                    {recipe.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ThemedModalBody>
      <ThemedModalFooter>
        {canEdit && mode === 'view' && (
          <ThemedButton variant="ghost" type="button" icon="pencil" iconOnly onClick={() => setMode('edit')}>
            {t('common.edit')}
          </ThemedButton>
        )}
        {mode === 'edit' && (
          <ThemedButton variant="ghost" type="button" icon="eye" iconOnly onClick={() => setMode('view')}>
            {t('features.meals.readMode')}
          </ThemedButton>
        )}
        {canEdit && (
          <ThemedButton
            variant="danger"
            type="button"
            icon="archive"
            iconOnly
            onClick={async () => {
              await onArchive();
              onClose();
            }}
          >
            {t('features.meals.archive')}
          </ThemedButton>
        )}
        <ThemedButton variant="ghost" type="button" icon="x" iconOnly onClick={onClose}>
          {t('features.meals.close')}
        </ThemedButton>
      </ThemedModalFooter>
    </ThemedModal>
  );
};

export default MealDetailModal;
