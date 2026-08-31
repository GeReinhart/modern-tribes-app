import { LabelBar } from '@/app/platform/core/layout/themes/components/LabelBar.tsx';
import { useLabelFilter } from '@/app/platform/core/layout/themes/components/useLabelFilter.ts';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { useRegisterTabActions } from '@/app/platform/core/layout/useRegisterTabActions.ts';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import CreateRecipeModal from './CreateRecipeModal.tsx';
import { useRecipes } from './hooks.ts';
import RecipeRow from './RecipeRow.tsx';

interface Props {
  featureInstanceId: string;
  canEdit: boolean;
  isManager: boolean;
  tribeId: string;
  projectId: string;
}

const RecipesTab: React.FC<Props> = ({ featureInstanceId, canEdit, tribeId, projectId }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { recipes, labels, error, createRecipe, createLabel, updateLabel, archiveLabel, reorderLabels } =
    useRecipes(featureInstanceId);
  const [creating, setCreating] = useState(false);
  const [configuringLabels, setConfiguringLabels] = useState(false);

  const tabActions = useMemo(
    () =>
      canEdit
        ? [
            { icon: 'plus' as const, label: t('features.recipes.newRecipe'), onClick: () => setCreating(true) },
            {
              icon: 'settings' as const,
              badgeIcon: 'tag' as const,
              label: configuringLabels
                ? t('features.recipes.doneConfiguringLabels')
                : t('features.recipes.configureLabels'),
              onClick: () => setConfiguringLabels((v) => !v),
            },
          ]
        : [],
    [canEdit, configuringLabels, t],
  );
  useRegisterTabActions(tabActions);

  const activeLabelIds = useMemo(() => new Set(recipes.flatMap((r) => r.label_ids)), [recipes]);
  const usageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    recipes.forEach((r) => r.label_ids.forEach((id) => { counts[id] = (counts[id] ?? 0) + 1; }));
    return counts;
  }, [recipes]);

  const { filterLabelIds, toggleFilterLabel, matchesLabelFilter } = useLabelFilter(activeLabelIds);
  const visibleRecipes = recipes.filter((r) => matchesLabelFilter(r.label_ids));

  const openRecipe = (recipeId: string) => {
    navigate(`/app/tribes/${tribeId}/projects/${projectId}/recipes/${recipeId}/present`);
  };

  return (
    <div>
      {error && (
        <div style={{ padding: '8px 12px', marginBottom: '12px', color: theme.colors.danger, fontSize: 'var(--font-sm)' }}>
          {error}
        </div>
      )}

      {labels.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <LabelBar
            labels={labels}
            activeLabelIds={activeLabelIds}
            filterLabelIds={filterLabelIds}
            onFilter={toggleFilterLabel}
            canEditLabels={canEdit && configuringLabels}
            usageCounts={usageCounts}
            onCreate={async (name, color) => { await createLabel(name, color); }}
            onUpdate={updateLabel}
            onDelete={archiveLabel}
            onReorder={reorderLabels}
          />
        </div>
      )}

      {recipes.length === 0 && (
        <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
          {t('features.recipes.empty')}
        </span>
      )}

      {visibleRecipes.map((recipe) => (
        <RecipeRow key={recipe.id} recipe={recipe} labels={labels} onOpen={() => openRecipe(recipe.id)} />
      ))}

      {creating && (
        <CreateRecipeModal
          featureInstanceId={featureInstanceId}
          onClose={() => setCreating(false)}
          onCreate={async (data) => {
            const created = await createRecipe(data);
            if (created) setCreating(false);
          }}
        />
      )}
    </div>
  );
};

export default RecipesTab;
