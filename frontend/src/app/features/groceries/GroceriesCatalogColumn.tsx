import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';
import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import AddCatalogItemModal from './AddCatalogItemModal.tsx';
import AddSectionModal from './AddSectionModal.tsx';
import GroceriesCatalogSectionGroup from './GroceriesCatalogSectionGroup.tsx';
import ManageItemModal from './ManageItemModal.tsx';
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
  onDeleteSection: (sectionId: string) => Promise<boolean>;
  onCreateItem: (data: GroceriesItemCreate) => Promise<GroceriesItem | null>;
  onLinkItemToSection: (itemId: string, sectionId: string) => Promise<void>;
  onUpdateItem: (itemId: string, data: Omit<GroceriesItemUpdate, 'feature_instance_id'>) => Promise<boolean>;
  onSetItemRenewal: (itemId: string, renewalDurationDays: number | null) => Promise<boolean>;
}

const GroceriesCatalogColumn: React.FC<Props> = ({
  featureInstanceId, items, sections, suggestions, excludeItemIds, canEdit,
  onAddItem, onCreateSection, onUpdateSection, onDeleteSection,
  onCreateItem, onLinkItemToSection, onUpdateItem, onSetItemRenewal,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [addingSection, setAddingSection] = useState(false);
  const [addingItemToSectionId, setAddingItemToSectionId] = useState<string | null>(null);
  const [renamingSection, setRenamingSection] = useState<GroceriesSection | null>(null);
  const [deletingSection, setDeletingSection] = useState<GroceriesSection | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [managingItemId, setManagingItemId] = useState<string | null>(null);

  const availableItems = items.filter((i) => !excludeItemIds.has(i.id));
  const groups = groupBySections(availableItems, sections, t('features.groceries.uncategorized'), true);
  const availableSuggestions = suggestions.filter((s) => !excludeItemIds.has(s.groceries_item_id));
  const managingItem = items.find((i) => i.id === managingItemId) ?? null;
  const addingItemToSection = addingItemToSectionId
    ? sections.find((s) => s.id === addingItemToSectionId) ?? null
    : null;

  const isSectionEmpty = (sectionId: string) => !items.some((i) => i.section_ids.includes(sectionId));

  const handleDeleteSection = async () => {
    if (!deletingSection) return;
    setDeleting(true);
    const ok = await onDeleteSection(deletingSection.id);
    setDeleting(false);
    if (ok) setDeletingSection(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: theme.colors.text, fontSize: 'var(--font-md)' }}>
          {t('features.groceries.catalog')}
        </h3>
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

      {availableSuggestions.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div
            style={{
              fontSize: 'var(--font-xs)', fontWeight: 700, color: theme.colors.secondary,
              textTransform: 'uppercase', marginBottom: '4px',
            }}
          >
            {t('features.groceries.suggestions')}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {availableSuggestions.map((s) => (
              <button
                key={s.groceries_item_id}
                type="button"
                onClick={() => onAddItem(s.groceries_item_id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '14px', fontSize: 'var(--font-xs)',
                  border: `1px solid ${theme.colors.accent}`, backgroundColor: 'transparent',
                  color: theme.colors.accent, cursor: 'pointer',
                }}
              >
                {s.icon && <ThemedSvgIcon name={s.icon as IconName} color={theme.colors.accent} size={12} />}
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {groups.length === 0 && (
        <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
          {t('features.groceries.catalogEmpty')}
        </span>
      )}

      {groups.map((group) => (
        <GroceriesCatalogSectionGroup
          key={group.id ?? 'uncategorized'}
          group={group}
          canEdit={canEdit}
          onAddItem={onAddItem}
          onAddNewItem={group.id ? () => setAddingItemToSectionId(group.id) : undefined}
          onRenameSection={group.id ? () => setRenamingSection(sections.find((s) => s.id === group.id) ?? null) : undefined}
          onDeleteSection={
            group.id && isSectionEmpty(group.id)
              ? () => setDeletingSection(sections.find((s) => s.id === group.id) ?? null)
              : undefined
          }
          onManageItem={(item) => setManagingItemId(item.id)}
        />
      ))}

      {addingSection && (
        <AddSectionModal
          title={t('features.groceries.addSection')}
          submitLabel={t('features.groceries.create')}
          onClose={() => setAddingSection(false)}
          onSubmit={async (name, icon) => {
            const created = await onCreateSection(name, icon ?? undefined);
            if (created) setAddingSection(false);
          }}
        />
      )}

      {renamingSection && (
        <AddSectionModal
          title={t('features.groceries.renameSection')}
          submitLabel={t('features.groceries.save')}
          initialName={renamingSection.name}
          initialIcon={renamingSection.icon}
          onClose={() => setRenamingSection(null)}
          onSubmit={async (name, icon) => {
            const ok = await onUpdateSection(renamingSection.id, { name, icon: icon ?? undefined });
            if (ok) setRenamingSection(null);
          }}
        />
      )}

      {deletingSection && (
        <ThemedConfirmDialog
          isOpen
          onClose={() => setDeletingSection(null)}
          onConfirm={handleDeleteSection}
          title={t('features.groceries.deleteSection')}
          message={t('features.groceries.deleteSectionMessage', { name: deletingSection.name })}
          variant="danger"
          isLoading={deleting}
        />
      )}

      {addingItemToSectionId && (
        <AddCatalogItemModal
          featureInstanceId={featureInstanceId}
          section={addingItemToSection}
          onClose={() => setAddingItemToSectionId(null)}
          onCreate={async (data) => {
            const created = await onCreateItem(data);
            if (created) {
              await onLinkItemToSection(created.id, addingItemToSectionId);
              setAddingItemToSectionId(null);
            }
          }}
        />
      )}

      {managingItem && (
        <ManageItemModal
          item={managingItem}
          sections={sections}
          onClose={() => setManagingItemId(null)}
          onUpdate={(data) => onUpdateItem(managingItem.id, data)}
          onSetRenewal={(renewalDurationDays) => onSetItemRenewal(managingItem.id, renewalDurationDays)}
          onToggleSection={(sectionId) => onLinkItemToSection(managingItem.id, sectionId)}
        />
      )}
    </div>
  );
};

export default GroceriesCatalogColumn;
