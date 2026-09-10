import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import AddRecipeComponentModal from './AddRecipeComponentModal.tsx';
import IngredientGroupBlock from './IngredientGroupBlock.tsx';
import { ingredientGroupKey } from './ingredientOrdering.ts';
import { RecipeComponent, RecipeComponentCreate } from './types.ts';

interface Props {
  components: RecipeComponent[];
  canEdit: boolean;
  projectId: string;
  currentRecipeId: string;
  onAdd: (data: RecipeComponentCreate) => Promise<boolean>;
  onRemove: (componentId: string) => void;
}

const ComponentBlock: React.FC<{ component: RecipeComponent; canEdit: boolean; onRemove: () => void }> = ({
  component, canEdit, onRemove,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const main = component.ingredients.filter((i) => ingredientGroupKey(i) === 'main');
  const condiments = component.ingredients.filter((i) => ingredientGroupKey(i) === 'condiment');
  const accompaniments = component.ingredients.filter((i) => ingredientGroupKey(i) === 'accompaniment');

  return (
    <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-md)', padding: '10px 12px', marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>
          {component.component_recipe_name} {t('features.recipes.componentMultiplier', { multiplier: component.multiplier })}
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={onRemove}
            title={t('features.recipes.removeComponent')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.danger, display: 'flex' }}
          >
            <ThemedSvgIcon name="x" color="currentColor" size={16} />
          </button>
        )}
      </div>
      <div style={{ columnCount: 2, columnGap: '24px', marginTop: '4px' }}>
        <IngredientGroupBlock ingredients={main} canEdit={false} />
        <IngredientGroupBlock title={t('features.recipes.condiments')} ingredients={condiments} canEdit={false} />
        <IngredientGroupBlock title={t('features.recipes.accompaniments')} ingredients={accompaniments} canEdit={false} />
      </div>
    </div>
  );
};

const RecipeComponentsSection: React.FC<Props> = ({ components, canEdit, projectId, currentRecipeId, onAdd, onRemove }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);

  if (components.length === 0 && !canEdit) return null;

  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: '8px' }}>{t('features.recipes.components')}</div>
      {components.map((component) => (
        <ComponentBlock
          key={component.id}
          component={component}
          canEdit={canEdit}
          onRemove={() => onRemove(component.id)}
        />
      ))}
      {canEdit && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          title={t('features.recipes.addComponent')}
          aria-label={t('features.recipes.addComponent')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: 'var(--radius-md)',
            border: `1px solid ${theme.colors.border}`, background: 'transparent',
            color: theme.colors.primary, cursor: 'pointer',
          }}
        >
          <ThemedSvgIcon name="plus" color="currentColor" size={16} />
        </button>
      )}
      {adding && (
        <AddRecipeComponentModal
          projectId={projectId}
          currentRecipeId={currentRecipeId}
          existingComponentIds={components.map((c) => c.component_recipe_id)}
          onClose={() => setAdding(false)}
          onSubmit={onAdd}
        />
      )}
    </div>
  );
};

export default RecipeComponentsSection;
