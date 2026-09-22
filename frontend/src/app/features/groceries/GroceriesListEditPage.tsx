import { BookmarkToggle } from '@/app/features/bookmarks/BookmarkToggle.tsx';
import { buildBookmarkDescription } from '@/app/features/bookmarks/types.ts';
import { useProjectPermissions } from '@/app/features/tribes-projects/projects/useProjectPermissions.ts';
import { useProject } from '@/app/features/tribes-projects/projects/useProjects.ts';
import { useTribeWithPositions } from '@/app/features/tribes-projects/tribes/useTribesWithPositions.ts';
import { AppLayout } from '@/app/platform/core/layout/AppLayout.tsx';
import { ThemeProvider } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import EditListModal from './EditListModal.tsx';
import GroceriesCatalogColumn from './GroceriesCatalogColumn.tsx';
import GroceriesListColumn from './GroceriesListColumn.tsx';
import { formatListTitle } from './listTitle.ts';
import { useGroceriesCatalog, useGroceriesListDetail } from './hooks.ts';
import MealSuggestionsModal from './MealSuggestionsModal.tsx';

const GroceriesListEditPageContent: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
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
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  const [mealSuggestionsOpen, setMealSuggestionsOpen] = useState(false);

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
      {
        id: 'groceries.backToList',
        icon: 'arrow-left' as const,
        label: t('features.groceries.backToList'),
        // Passes skipAutoOpen so the tab shows the list-of-lists even when there's a single
        // ongoing list — otherwise the tab would auto-redirect straight back into this list.
        onClick: () => navigate(backPath, { state: { skipAutoOpen: true } }),
      },
      { id: 'groceries.shoppingMode', icon: 'check-square' as const, label: t('features.groceries.shoppingMode'), path: shoppingPath },
      {
        id: 'groceries.addFromMeals',
        icon: 'calendar' as const,
        label: t('features.groceries.addFromMeals'),
        onClick: () => setMealSuggestionsOpen(true),
      },
      {
        id: 'groceries.toggleCatalog',
        icon: showFullCatalog ? ('eye-off' as const) : ('eye' as const),
        label: showFullCatalog ? t('features.groceries.hideCatalog') : t('features.groceries.showCatalog'),
        onClick: () => setShowFullCatalog((v) => !v),
      },
      ...(canEdit
        ? [
            {
              id: 'groceries.editList',
              icon: 'pencil' as const,
              label: t('features.groceries.editList'),
              onClick: () => setEditingList(true),
            },
            {
              id: 'groceries.configureSections',
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
    [backPath, shoppingPath, canEdit, configuringSections, showFullCatalog, t, navigate],
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
      {mealSuggestionsOpen && (
        <MealSuggestionsModal
          suggestions={mealSuggestions}
          canEdit={canEdit}
          onClose={() => setMealSuggestionsOpen(false)}
          onAddAll={addMealSuggestion}
          onRemoveAll={removeMealSuggestion}
          onAddIngredient={addSuggestedIngredient}
        />
      )}
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
            showFullCatalog={showFullCatalog}
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
