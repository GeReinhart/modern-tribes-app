import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { groupCatalogItemsByFoodSection } from './catalogGrouping.ts';
import RecipeIngredientSectionGroup from './RecipeIngredientSectionGroup.tsx';
import { CatalogItemOption, CatalogSectionOption } from './types.ts';

interface Props {
  items: CatalogItemOption[];
  sections: CatalogSectionOption[];
  onSelect: (itemId: string) => void;
}

const RecipeIngredientCatalogPicker: React.FC<Props> = ({ items, sections, onSelect }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [filter, setFilter] = useState('');

  const groups = groupCatalogItemsByFoodSection(items, sections);
  const hasAnyVisibleItem = groups.some(
    (g) => filter.trim() === '' || g.items.some((i) => i.name.toLowerCase().includes(filter.trim().toLowerCase())),
  );

  return (
    <div>
      <ThemedInput
        label={t('features.recipes.catalogItem')}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={t('features.recipes.searchIngredientPlaceholder')}
      />
      <div style={{ marginTop: '8px' }}>
        {groups.length === 0 && (
          <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
            {t('features.recipes.noFoodSections')}
          </span>
        )}
        {groups.length > 0 && !hasAnyVisibleItem && (
          <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
            {t('features.recipes.noMatchingIngredients')}
          </span>
        )}
        {groups.map((group) => (
          <RecipeIngredientSectionGroup key={group.id} group={group} filter={filter} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
};

export default RecipeIngredientCatalogPicker;
