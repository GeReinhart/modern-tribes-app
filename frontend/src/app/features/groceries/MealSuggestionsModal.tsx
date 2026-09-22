import { ThemedModal, ThemedModalBody } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import MealSuggestionsPanel from './MealSuggestionsPanel.tsx';
import { MealSuggestion } from './types.ts';

interface Props {
  suggestions: MealSuggestion[];
  canEdit: boolean;
  onClose: () => void;
  onAddAll: (mealId: string) => Promise<void>;
  onRemoveAll: (mealId: string) => Promise<void>;
  onAddIngredient: (mealId: string, recipeIngredientId: string) => Promise<void>;
}

const MealSuggestionsModal: React.FC<Props> = ({
  suggestions, canEdit, onClose, onAddAll, onRemoveAll, onAddIngredient,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <ThemedModal isOpen onClose={onClose} title={t('features.groceries.mealSuggestionsTitle')} size="lg">
      <ThemedModalBody>
        {suggestions.length === 0 ? (
          <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
            {t('features.groceries.noMealSuggestions')}
          </span>
        ) : (
          <MealSuggestionsPanel
            suggestions={suggestions}
            canEdit={canEdit}
            onAddAll={onAddAll}
            onRemoveAll={onRemoveAll}
            onAddIngredient={onAddIngredient}
          />
        )}
      </ThemedModalBody>
    </ThemedModal>
  );
};

export default MealSuggestionsModal;
