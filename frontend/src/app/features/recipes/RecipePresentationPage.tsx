import { useProjectPermissions } from '@/app/features/tribes-projects/projects/useProjectPermissions.ts';
import { useProject } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { useDocumentTitle } from '@/app/platform/core/browser/useDocumentTitle.ts';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemedLoadingSpinner } from '@/app/platform/core/layout/themes/components/ThemedLoadingSpinner.tsx';
import { ThemedSection } from '@/app/platform/core/layout/themes/components/ThemedSection.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { errorStyle } from '@/app/platform/core/layout/themes/theme.styles.tsx';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import RecipeDetailBody from './RecipeDetailBody.tsx';
import { useRecipeDetail, useRecipeLabels } from './hooks.ts';

const noop = async () => undefined;

const RecipePresentationPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { tribeId, projectId, recipeId } = useParams<{ tribeId: string; projectId: string; recipeId: string }>();

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project } = useProject(projectId || null);
  const { canEdit } = useProjectPermissions(tribeId || null, projectId || null);
  const { detail, error } = useRecipeDetail(recipeId || null);
  const labelsHook = useRecipeLabels(detail?.feature_instance_id ?? null);
  useDocumentTitle(detail?.name);

  const editPath = `/app/tribes/${tribeId}/projects/${projectId}/recipes/${recipeId}`;
  const listPath = `/app/tribes/${tribeId}/projects/${projectId}${detail ? `/${detail.feature_instance_id}` : ''}`;

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('tribes.title'), path: '/app/tribes' },
      { label: tribe?.name || t('common.loading'), path: `/app/tribes/${tribeId}` },
      { label: project?.name || t('common.loading'), path: `/app/tribes/${tribeId}/projects/${projectId}` },
      { label: detail ? detail.name : t('common.loading') },
    ],
    [tribe?.name, project?.name, detail, tribeId, projectId, t],
  );

  const menuActions = useMemo(
    () => [
      { icon: 'search' as const, label: t('features.recipes.backToList'), path: listPath },
      ...(canEdit ? [{ icon: 'pencil' as const, label: t('features.recipes.editRecipe'), path: editPath }] : []),
    ],
    [listPath, editPath, canEdit, t],
  );

  if (!detail) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        {error ? <div style={errorStyle}>{error}</div> : (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <ThemedLoadingSpinner size="sm" />
          </div>
        )}
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions}>
      <ThemedSection themeId="main_1">
        <RecipeDetailBody
          recipe={detail}
          labels={labelsHook.labels}
          canEdit={false}
          onUpdate={noop}
          onCreateLabel={noop}
          onToggleLabel={noop}
          onUpdateLabel={noop}
          onDeleteLabel={noop}
          onReorderLabel={noop}
          onAddIngredient={async () => false}
          onMoveIngredient={noop}
          onUpdateIngredient={noop}
          onRemoveIngredient={noop}
        />
      </ThemedSection>
    </AppLayout>
  );
};

export const RecipePresentationPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <RecipePresentationPageContent />
  </ThemeProvider>
);
