import { BookmarkToggle } from '@/app/features/bookmarks/BookmarkToggle.tsx';
import { buildBookmarkDescription } from '@/app/features/bookmarks/types.ts';
import { useProjectPermissions } from '@/app/features/tribes-projects/projects/useProjectPermissions.ts';
import { useProject } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';

import EditListModal from './EditListModal.tsx';
import GroceriesCatalogColumn from './GroceriesCatalogColumn.tsx';
import GroceriesListColumn from './GroceriesListColumn.tsx';
import { formatListTitle } from './listTitle.ts';
import { useGroceriesCatalog, useGroceriesListDetail } from './hooks.ts';
import MealSuggestionsPanel from './MealSuggestionsPanel.tsx';

const GroceriesListEditPageContent: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { tribeId, projectId, listId } = useParams<{ tribeId: string; projectId: string; listId: string }>();

  const { tribe } = useTribeWithPositions(tribeId || null);
  const { project } = useProject(projectId || null);
  const { canEdit } = useProjectPermissions(tribeId || null, projectId || null);
  const {
    detail, mealSuggestions, error: detailError, addItem, addMealSuggestion, removeMealSuggestion,
    addSuggestedIngredient, updateQuantity, updateComment,
    updateListDetails, removeItem,
  } = useGroceriesListDetail(listId || null);
  const catalog = useGroceriesCatalog(detail?.feature_instance_id ?? null);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [configuringSections, setConfiguringSections] = useState(false);
  const [editingList, setEditingList] = useState(false);

  const listItemCatalogIds = useMemo(
    () => new Set(detail?.items.map((i) => i.groceries_item_id).filter((id): id is string => id !== null) ?? []),
    [detail?.items],
  );

  const handleAddItem = async (itemId: string) => {
    const suggestedQuantity = catalog.items.find((i) => i.id === itemId)?.suggested_quantity;
    const newId = await addItem({ groceries_item_id: itemId, quantity: suggestedQuantity ?? 1 });
    setFocusItemId(newId);
  };

  const handleAddCustomItem = async (name: string, unit: string) => {
    const newId = await addItem({ custom_name: name, custom_unit: unit || undefined, quantity: 1 });
    setFocusItemId(newId);
  };

  const backPath = `/app/tribes/${tribeId}/projects/${projectId}${
    detail ? `/${detail.feature_instance_id}` : ''
  }`;

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

  const shoppingPath = `/app/tribes/${tribeId}/projects/${projectId}/groceries/${listId}`;

  const menuActions = useMemo(
    () => [
      { icon: 'arrow-left' as const, label: t('features.groceries.backToList'), path: backPath },
      { icon: 'check-square' as const, label: t('features.groceries.shoppingMode'), path: shoppingPath },
      ...(canEdit
        ? [
            {
              icon: 'pencil' as const,
              label: t('features.groceries.editList'),
              onClick: () => setEditingList(true),
            },
            {
              icon: 'settings' as const,
              badgeIcon: 'layers' as const,
              label: configuringSections
                ? t('features.groceries.doneConfiguringSections')
                : t('features.groceries.configureSections'),
              onClick: () => setConfiguringSections((v) => !v),
            },
          ]
        : []),
    ],
    [backPath, shoppingPath, canEdit, configuringSections, t],
  );

  if (!detail) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        {detailError && <div>{detailError}</div>}
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs} menuActions={menuActions} bookmarkSlot={bookmarkSlot}>
      {editingList && (
        <EditListModal
          initialName={detail.name ?? ''}
          initialScheduledDate={detail.scheduled_date}
          onClose={() => setEditingList(false)}
          onSubmit={updateListDetails}
        />
      )}
      {(detailError || catalog.error) && <div>{detailError || catalog.error}</div>}
      <MealSuggestionsPanel
        suggestions={mealSuggestions}
        canEdit={canEdit}
        onAddAll={addMealSuggestion}
        onRemoveAll={removeMealSuggestion}
        onAddIngredient={addSuggestedIngredient}
      />
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', minWidth: '280px' }}>
          <GroceriesCatalogColumn
            featureInstanceId={detail.feature_instance_id}
            items={catalog.items}
            sections={catalog.sections}
            suggestions={catalog.suggestions}
            excludeItemIds={listItemCatalogIds}
            canEdit={canEdit}
            configuring={configuringSections}
            onAddItem={handleAddItem}
            onCreateSection={catalog.createSection}
            onUpdateSection={catalog.updateSection}
            onReorderSections={catalog.reorderSections}
            onDeleteSection={catalog.deleteSection}
            onCreateItem={catalog.createItem}
            onLinkItemToSection={catalog.linkItemToSection}
            onUpdateItem={catalog.updateItem}
            onSetItemRenewal={catalog.setItemRenewal}
            onSetItemSuggestedQuantity={catalog.setItemSuggestedQuantity}
          />
        </div>
        <div style={{ flex: '1 1 320px', minWidth: '280px' }}>
          <GroceriesListColumn
            items={detail.items}
            catalogItems={catalog.items}
            sections={catalog.sections}
            canEdit={canEdit}
            onUpdateQuantity={updateQuantity}
            onUpdateComment={updateComment}
            onRemove={removeItem}
            onAddCustomItem={handleAddCustomItem}
            onUpdateCatalogItem={catalog.updateItem}
            onSetCatalogItemRenewal={catalog.setItemRenewal}
            onSetCatalogItemSuggestedQuantity={catalog.setItemSuggestedQuantity}
            onToggleCatalogItemSection={catalog.linkItemToSection}
            focusItemId={focusItemId}
            onFocused={() => setFocusItemId(null)}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export const GroceriesListEditPage: React.FC = () => (
  <ThemeProvider defaultTheme="default">
    <GroceriesListEditPageContent />
  </ThemeProvider>
);
