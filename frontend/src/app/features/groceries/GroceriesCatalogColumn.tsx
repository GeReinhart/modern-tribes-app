import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import GroceriesCatalogModals from './GroceriesCatalogModals.tsx';
import GroceriesCatalogSectionGroup from './GroceriesCatalogSectionGroup.tsx';
import { groupBySections } from './sectionGrouping.ts';
import {
  GroceriesItem, GroceriesItemCreate, GroceriesItemUpdate, GroceriesSection, GroceriesSectionUpdate,
  GroceriesSuggestion,
} from './types.ts';

interface Props {
  featureInstanceId: string;
  items: GroceriesItem[];
  sections: GroceriesSection[];
  suggestions: GroceriesSuggestion[];
  excludeItemIds: Set<string>;
  canEdit: boolean;
  onAddItem: (itemId: string) => Promise<void>;
  onCreateSection: (name: string, icon?: string) => Promise<GroceriesSection | null>;
  onUpdateSection: (sectionId: string, data: Omit<GroceriesSectionUpdate, 'feature_instance_id'>) => Promise<boolean>;
  onReorderSections: (orderedIds: string[]) => Promise<boolean>;
  onDeleteSection: (sectionId: string) => Promise<boolean>;
  onCreateItem: (data: GroceriesItemCreate) => Promise<GroceriesItem | null>;
  onLinkItemToSection: (itemId: string, sectionId: string) => Promise<void>;
  onUpdateItem: (itemId: string, data: Omit<GroceriesItemUpdate, 'feature_instance_id'>) => Promise<boolean>;
  onSetItemRenewal: (itemId: string, renewalDurationDays: number | null) => Promise<boolean>;
}

const GroceriesCatalogColumn: React.FC<Props> = ({
  featureInstanceId, items, sections, suggestions, excludeItemIds, canEdit,
  onAddItem, onCreateSection, onUpdateSection, onReorderSections, onDeleteSection,
  onCreateItem, onLinkItemToSection, onUpdateItem, onSetItemRenewal,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [addingSection, setAddingSection] = useState(false);
  const [addingItemToSectionId, setAddingItemToSectionId] = useState<string | null>(null);
  const [renamingSection, setRenamingSection] = useState<GroceriesSection | null>(null);
  const [deletingSection, setDeletingSection] = useState<GroceriesSection | null>(null);
  const [managingItemId, setManagingItemId] = useState<string | null>(null);
  const [catalogExpanded, setCatalogExpanded] = useState(true);
  const [filter, setFilter] = useState('');

  const normalizedFilter = filter.trim().toLowerCase();
  const matchesFilter = (name: string) => name.toLowerCase().includes(normalizedFilter);

  const availableItems = items.filter((i) => !excludeItemIds.has(i.id) && matchesFilter(i.name));
  const groups = groupBySections(
    availableItems, sections, t('features.groceries.uncategorized'), normalizedFilter === '',
  );
  const availableSuggestions = suggestions.filter((s) => !excludeItemIds.has(s.groceries_item_id));
  const suggestionItems = availableSuggestions
    .map((s) => items.find((i) => i.id === s.groceries_item_id))
    .filter((i): i is GroceriesItem => !!i)
    .filter((i) => matchesFilter(i.name));
  const managingItem = items.find((i) => i.id === managingItemId) ?? null;

  const isSectionEmpty = (sectionId: string) => !items.some((i) => i.section_ids.includes(sectionId));
  const sectionIndex = (sectionId: string) => sections.findIndex((s) => s.id === sectionId);

  const handleSelectItem = async (itemId: string) => {
    await onAddItem(itemId);
    setFilter('');
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    const index = sections.findIndex((s) => s.id === sectionId);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= sections.length) return;
    const orderedIds = sections.map((s) => s.id);
    [orderedIds[index], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[index]];
    onReorderSections(orderedIds);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div
          onClick={() => setCatalogExpanded((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <ThemedSvgIcon
            name={catalogExpanded ? 'chevron-down' : 'chevron-up'}
            color={theme.colors.text}
            size={16}
          />
          <h3 style={{ margin: 0, color: theme.colors.text, fontSize: 'var(--font-md)' }}>
            {t('features.groceries.catalog')}
          </h3>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setAddingSection(true)}
            title={t('features.groceries.addSection')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.primary, display: 'flex' }}
          >
            <ThemedSvgIcon name="plus" color="currentColor" size={20} />
          </button>
        )}
      </div>

      {catalogExpanded && (
        <>
          <div style={{ marginBottom: '10px' }}>
            <ThemedInput
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder={t('features.groceries.filterItemsPlaceholder')}
            />
          </div>

          {suggestionItems.length > 0 && (
            <GroceriesCatalogSectionGroup
              group={{ id: null, name: t('features.groceries.suggestions'), icon: null, items: suggestionItems }}
              canEdit={canEdit}
              onAddItem={handleSelectItem}
              onManageItem={(item) => setManagingItemId(item.id)}
            />
          )}

          {groups.length === 0 && suggestionItems.length === 0 && (
            <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
              {normalizedFilter === '' ? t('features.groceries.catalogEmpty') : t('features.groceries.filterNoResults')}
            </span>
          )}

          {groups.map((group) => (
            <GroceriesCatalogSectionGroup
              key={group.id ?? 'uncategorized'}
              group={group}
              canEdit={canEdit}
              onAddItem={handleSelectItem}
              onAddNewItem={group.id ? () => setAddingItemToSectionId(group.id) : undefined}
              onRenameSection={group.id ? () => setRenamingSection(sections.find((s) => s.id === group.id) ?? null) : undefined}
              onMoveUp={group.id && sectionIndex(group.id) > 0 ? () => moveSection(group.id as string, -1) : undefined}
              onMoveDown={
                group.id && sectionIndex(group.id) < sections.length - 1
                  ? () => moveSection(group.id as string, 1)
                  : undefined
              }
              onDeleteSection={
                group.id && isSectionEmpty(group.id)
                  ? () => setDeletingSection(sections.find((s) => s.id === group.id) ?? null)
                  : undefined
              }
              onManageItem={(item) => setManagingItemId(item.id)}
            />
          ))}
        </>
      )}

      <GroceriesCatalogModals
        featureInstanceId={featureInstanceId}
        sections={sections}
        addingSection={addingSection}
        onCloseAddingSection={() => setAddingSection(false)}
        onCreateSection={onCreateSection}
        renamingSection={renamingSection}
        onCloseRenamingSection={() => setRenamingSection(null)}
        onUpdateSection={onUpdateSection}
        deletingSection={deletingSection}
        onCloseDeletingSection={() => setDeletingSection(null)}
        onDeleteSection={onDeleteSection}
        addingItemToSectionId={addingItemToSectionId}
        onCloseAddingItem={() => setAddingItemToSectionId(null)}
        onCreateItem={onCreateItem}
        onLinkItemToSection={onLinkItemToSection}
        managingItem={managingItem}
        onCloseManagingItem={() => setManagingItemId(null)}
        onUpdateItem={onUpdateItem}
        onSetItemRenewal={onSetItemRenewal}
      />
    </div>
  );
};

export default GroceriesCatalogColumn;
