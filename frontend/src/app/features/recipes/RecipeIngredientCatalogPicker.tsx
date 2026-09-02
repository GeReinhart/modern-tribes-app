import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { groupCatalogItemsByFoodSection } from './catalogGrouping.ts';
import RecipeIngredientSectionGroup from './RecipeIngredientSectionGroup.tsx';
import { CatalogItemOption, CatalogSectionOption } from './types.ts';

interface Props {
  items: CatalogItemOption[];
  sections: CatalogSectionOption[];
  filter: string;
  onSelect: (itemId: string) => void;
}

const RecipeIngredientCatalogPicker: React.FC<Props> = ({ items, sections, filter, onSelect }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const groups = groupCatalogItemsByFoodSection(items, sections);

  if (groups.length === 0) {
    return (
      <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
        {t('features.recipes.noFoodSections')}
      </span>
    );
  }

  return (
    <div>
      {groups.map((group) => (
        <RecipeIngredientSectionGroup key={group.id} group={group} filter={filter} onSelect={onSelect} />
      ))}
    </div>
  );
};

export default RecipeIngredientCatalogPicker;
