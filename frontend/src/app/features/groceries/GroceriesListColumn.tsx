import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AddCustomListItemModal from './AddCustomListItemModal.tsx';
import GroceriesListSectionGroup from './GroceriesListSectionGroup.tsx';
import ManageItemModal from './ManageItemModal.tsx';
import { groupBySections } from './sectionGrouping.ts';
import { GroceriesItem, GroceriesItemUpdate, GroceriesListItemDetail, GroceriesSection } from './types.ts';

interface Props {
  items: GroceriesListItemDetail[];
  catalogItems: GroceriesItem[];
  sections: GroceriesSection[];
  canEdit: boolean;
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onUpdateComment: (id: string, comment: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onAddCustomItem: (name: string, unit: string) => Promise<void>;
  onUpdateCatalogItem: (itemId: string, data: Omit<GroceriesItemUpdate, 'feature_instance_id'>) => Promise<boolean>;
  onSetCatalogItemRenewal: (itemId: string, renewalDurationDays: number | null) => Promise<boolean>;
  onSetCatalogItemSuggestedQuantity: (itemId: string, suggestedQuantity: number | null) => Promise<boolean>;
  onToggleCatalogItemSection: (itemId: string, sectionId: string) => Promise<void>;
  focusItemId: string | null;
  onFocused: () => void;
}

const GroceriesListColumn: React.FC<Props> = ({
  items, catalogItems, sections, canEdit, onUpdateQuantity, onUpdateComment, onRemove, onAddCustomItem,
  onUpdateCatalogItem, onSetCatalogItemRenewal, onSetCatalogItemSuggestedQuantity, onToggleCatalogItemSection,
  focusItemId, onFocused,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [addingCustomItem, setAddingCustomItem] = useState(false);
  const [managingCatalogItemId, setManagingCatalogItemId] = useState<string | null>(null);
  const groups = groupBySections(items, sections, t('features.groceries.uncategorized'));
  const managingCatalogItem = catalogItems.find((i) => i.id === managingCatalogItemId) ?? null;

  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string | null>>(
    () => new Set(groups.map((g) => g.id)),
  );
  const knownSectionIdsRef = useRef<Set<string | null>>(new Set(groups.map((g) => g.id)));

  useEffect(() => {
    const newIds = groups.map((g) => g.id).filter((id) => !knownSectionIdsRef.current.has(id));
    if (newIds.length === 0) return;
    newIds.forEach((id) => knownSectionIdsRef.current.add(id));
    setExpandedSectionIds((prev) => {
      const next = new Set(prev);
      newIds.forEach((id) => next.add(id));
      return next;
    });
  }, [groups]);

  useEffect(() => {
    if (!focusItemId) return;
    const focusedItem = items.find((i) => i.id === focusItemId);
    if (!focusedItem) return;
    const targetSectionIds = focusedItem.section_ids.length > 0 ? focusedItem.section_ids : [null];
    setExpandedSectionIds(new Set(targetSectionIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to a newly focused item, not every items update
  }, [focusItemId]);

  const toggleSection = (sectionId: string | null) => {
    setExpandedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId); else next.add(sectionId);
      return next;
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, color: theme.colors.text, fontSize: 'var(--font-md)' }}>
          {t('features.groceries.myList')}
        </h3>
        {canEdit && (
          <button
            type="button"
            onClick={() => setAddingCustomItem(true)}
            title={t('features.groceries.addCustomItem')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.primary, display: 'flex' }}
          >
            <ThemedSvgIcon name="plus" color="currentColor" size={20} />
          </button>
        )}
      </div>

      {addingCustomItem && (
        <AddCustomListItemModal
          onClose={() => setAddingCustomItem(false)}
          onSubmit={async (name, unit) => {
            await onAddCustomItem(name, unit);
            setAddingCustomItem(false);
          }}
        />
      )}

      {managingCatalogItem && (
        <ManageItemModal
          item={managingCatalogItem}
          sections={sections}
          onClose={() => setManagingCatalogItemId(null)}
          onUpdate={(data) => onUpdateCatalogItem(managingCatalogItem.id, data)}
          onSetRenewal={(renewalDurationDays) => onSetCatalogItemRenewal(managingCatalogItem.id, renewalDurationDays)}
          onSetSuggestedQuantity={
            (suggestedQuantity) => onSetCatalogItemSuggestedQuantity(managingCatalogItem.id, suggestedQuantity)
          }
          onToggleSection={(sectionId) => onToggleCatalogItemSection(managingCatalogItem.id, sectionId)}
        />
      )}

      {items.length === 0 && (
        <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
          {t('features.groceries.noItems')}
        </span>
      )}

      {groups.map((group) => (
        <GroceriesListSectionGroup
          key={group.id ?? 'uncategorized'}
          group={group}
          canEdit={canEdit}
          expanded={expandedSectionIds.has(group.id)}
          onToggle={() => toggleSection(group.id)}
          onUpdateQuantity={onUpdateQuantity}
          onUpdateComment={onUpdateComment}
          onRemove={onRemove}
          onManageCatalogItem={setManagingCatalogItemId}
          focusItemId={focusItemId}
          onFocused={onFocused}
        />
      ))}
    </div>
  );
};

export default GroceriesListColumn;
