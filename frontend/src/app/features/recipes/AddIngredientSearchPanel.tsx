import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { groupCatalogItemsByFoodSection } from './catalogGrouping.ts';
import RecipeIngredientCatalogPicker from './RecipeIngredientCatalogPicker.tsx';
import { CatalogItemOption, CatalogSectionOption } from './types.ts';

interface Props {
  items: CatalogItemOption[];
  sections: CatalogSectionOption[];
  search: string;
  onSearchChange: (search: string) => void;
  onSelectCatalogItem: (itemId: string) => void;
  onChooseAddToCatalog: () => void;
  onChooseOneOff: () => void;
}

function hasMatchingItem(items: CatalogItemOption[], sections: CatalogSectionOption[], normalizedSearch: string): boolean {
  if (normalizedSearch === '') return items.length > 0;
  const groups = groupCatalogItemsByFoodSection(items, sections);
  return groups.some((g) => g.items.some((i) => i.name.toLowerCase().includes(normalizedSearch)));
}

const AddIngredientSearchPanel: React.FC<Props> = ({
  items, sections, search, onSearchChange, onSelectCatalogItem, onChooseAddToCatalog, onChooseOneOff,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const normalizedSearch = search.trim().toLowerCase();
  const showNoMatchActions = normalizedSearch !== '' && !hasMatchingItem(items, sections, normalizedSearch);

  return (
    <>
      <ThemedInput
        label={t('features.recipes.ingredientSearchLabel')}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={t('features.recipes.searchIngredientPlaceholder')}
        autoFocus
      />
      {showNoMatchActions && (
        <div
          style={{
            display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px',
            border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-md)',
          }}
        >
          <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
            {t('features.recipes.noCatalogMatch', { query: search.trim() })}
          </span>
          <ThemedButton variant="secondary" type="button" onClick={onChooseAddToCatalog}>
            {t('features.recipes.addToCatalogAction', { query: search.trim() })}
          </ThemedButton>
          <ThemedButton variant="ghost" type="button" onClick={onChooseOneOff}>
            {t('features.recipes.notInCatalogAction')}
          </ThemedButton>
        </div>
      )}
      <RecipeIngredientCatalogPicker items={items} sections={sections} filter={search} onSelect={onSelectCatalogItem} />
    </>
  );
};

export default AddIngredientSearchPanel;
