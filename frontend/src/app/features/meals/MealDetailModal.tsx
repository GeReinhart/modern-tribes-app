import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedMultiSelect } from '@/app/platform/core/layout/themes/components/ThemedMultiSelect.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { Meal, PersonOption, RecipeOption } from './types.ts';

interface Props {
  meal: Meal;
  persons: PersonOption[];
  recipes: RecipeOption[];
  canEdit: boolean;
  onUpdate: (data: { title?: string; headcount?: number }) => Promise<void>;
  onSetParticipants: (personIds: string[]) => Promise<void>;
  onToggleRecipe: (recipeId: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

const MealDetailModal: React.FC<Props> = ({
  meal, persons, recipes, canEdit, onUpdate, onSetParticipants, onToggleRecipe, onDelete, onClose,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <ThemedModal isOpen onClose={onClose} title={meal.title}>
      <ThemedModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {canEdit ? (
            <div style={{ display: 'flex', gap: '16px' }}>
              <ThemedInput
                label={t('features.meals.title')}
                defaultValue={meal.title}
                onBlur={(e) => e.target.value.trim() && onUpdate({ title: e.target.value.trim() })}
              />
              <ThemedInput
                label={t('features.meals.headcount')}
                type="number"
                min={0}
                defaultValue={meal.headcount}
                onBlur={(e) => {
                  const value = Number(e.target.value);
                  if (Number.isInteger(value) && value >= 0) onUpdate({ headcount: value });
                }}
              />
            </div>
          ) : (
            <div>{t('features.meals.headcountValue', { count: meal.headcount })}</div>
          )}

          <div>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('features.meals.participants')}</div>
            <ThemedMultiSelect
              options={persons.map((p) => ({ value: p.id, label: p.name }))}
              value={meal.participant_ids}
              onChange={onSetParticipants}
              disabled={!canEdit}
              placeholder={t('features.meals.selectParticipants')}
            />
          </div>

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
                return (
                  <button
                    key={recipe.id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => onToggleRecipe(recipe.id)}
                    style={{
                      border: `1px solid ${theme.colors.border}`,
                      background: linked ? theme.colors.primary : 'transparent',
                      color: linked ? '#fff' : theme.colors.text,
                      borderRadius: '10px',
                      padding: '2px 10px',
                      fontSize: 'var(--font-xs)',
                      cursor: canEdit ? 'pointer' : 'default',
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
      {canEdit && (
        <ThemedModalFooter>
          <ThemedButton
            variant="danger"
            type="button"
            onClick={async () => {
              await onDelete();
              onClose();
            }}
          >
            {t('features.meals.delete')}
          </ThemedButton>
        </ThemedModalFooter>
      )}
    </ThemedModal>
  );
};

export default MealDetailModal;
