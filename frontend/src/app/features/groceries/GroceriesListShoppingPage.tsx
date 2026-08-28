import { BookmarkToggle } from '@/app/features/bookmarks/BookmarkToggle.tsx';
import { buildBookmarkDescription } from '@/app/features/bookmarks/types.ts';
import { useProjectPermissions } from '@/app/features/tribes-projects/projects/useProjectPermissions.ts';
import { useProject } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';

import AddedMealsBanner from './AddedMealsBanner.tsx';
import GroceriesShoppingSectionGroup from './GroceriesShoppingSectionGroup.tsx';
import { useGroceriesCatalog, useGroceriesListDetail } from './hooks.ts';
import { formatListTitle } from './listTitle.ts';
import { groupBySections } from './sectionGrouping.ts';

const GroceriesListShoppingPageContent: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const location = useLocation();
  const { tribeId, projectId, listId } = useParams<{ tribeId: string; projectId: string; listId: string }>();

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project } = useProject(projectId || null);
  const { canEdit } = useProjectPermissions(tribeId || null, projectId || null);
  const { detail, addedMeals, error, togglePickedUp } = useGroceriesListDetail(listId || null);
  const { sections } = useGroceriesCatalog(detail?.feature_instance_id ?? null);

  const editPath = `/app/tribes/${tribeId}/projects/${projectId}/groceries/${listId}/edit`;
  const backPath = `/app/tribes/${tribeId}/projects/${projectId}${detail ? `/${detail.feature_instance_id}` : ''}`;

  const breadcrumbs = useMemo(
    () => [
      { label: t('common.home'), path: '/app' },
      { label: t('tribes.title'), path: '/app/tribes' },
      { label: tribe?.name || t('common.loading'), path: `/app/tribes/${tribeId}` },
      { label: project?.name || t('common.loading'), path: `/app/tribes/${tribeId}/projects/${projectId}` },
      { label: detail ? formatListTitle(detail.name, t) : t('common.loading') },
    ],
    [tribe?.name, project?.name, detail, tribeId, projectId, t],
  );

  const bookmarkSlot = detail ? (
    <BookmarkToggle
      pagePath={location.pathname}
      pageTitle={formatListTitle(detail.name, t)}
      pageDescription={buildBookmarkDescription(breadcrumbs)}
    />
  ) : null;

  const menuActions = useMemo(
    () => [
      { icon: 'arrow-left' as const, label: t('features.groceries.backToList'), path: backPath },
      ...(canEdit ? [{ icon: 'pencil' as const, label: t('features.groceries.editItems'), path: editPath }] : []),
    ],
    [backPath, editPath, canEdit, t],
  );

  if (!detail) {
    return <AppLayout breadcrumbs={breadcrumbs}>{error && <div>{error}</div>}</AppLayout>;
  }

  const remaining = detail.items.filter((i) => !i.picked_up).length;
  const groups = groupBySections(detail.items, sections, t('features.groceries.uncategorized'));

  return (
    <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions} bookmarkSlot={bookmarkSlot}>
      {error && (
        <div style={{ color: theme.colors.danger, fontSize: 'var(--font-sm)', marginBottom: '12px' }}>{error}</div>
      )}

      <div style={{ fontSize: 'var(--font-xs)', color: theme.colors.secondary, marginBottom: '12px' }}>
        {t('features.groceries.remainingCount', { count: remaining, total: detail.items.length })}
      </div>

      <AddedMealsBanner meals={addedMeals} />

      {detail.items.length === 0 && (
        <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
          {t('features.groceries.noItems')}
        </div>
      )}

      {groups.map((group) => (
        <GroceriesShoppingSectionGroup
          key={group.id ?? 'uncategorized'}
          group={group}
          canEdit={canEdit}
          onTogglePickedUp={togglePickedUp}
        />
      ))}
    </AppLayout>
  );
};

export const GroceriesListShoppingPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <GroceriesListShoppingPageContent />
  </ThemeProvider>
);
