import { ThemedConfirmDialog } from '@/app/platform/core/layout/themes/components/ThemedConfirmDialog.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import AddCatalogItemModal from './AddCatalogItemModal.tsx';
import AddSectionModal from './AddSectionModal.tsx';
import ManageItemModal from './ManageItemModal.tsx';
import {
  GroceriesItem, GroceriesItemCreate, GroceriesItemUpdate, GroceriesSection, GroceriesSectionUpdate,
} from './types.ts';

interface Props {
  featureInstanceId: string;
  sections: GroceriesSection[];
  addingSection: boolean;
  onCloseAddingSection: () => void;
  onCreateSection: (name: string, icon?: string, isFood?: boolean) => Promise<GroceriesSection | null>;
  renamingSection: GroceriesSection | null;
  onCloseRenamingSection: () => void;
  onUpdateSection: (sectionId: string, data: Omit<GroceriesSectionUpdate, 'feature_instance_id'>) => Promise<boolean>;
  deletingSection: GroceriesSection | null;
  onCloseDeletingSection: () => void;
  onDeleteSection: (sectionId: string) => Promise<boolean>;
  addingItemToSectionId: string | null;
  onCloseAddingItem: () => void;
  onCreateItem: (data: GroceriesItemCreate) => Promise<GroceriesItem | null>;
  onLinkItemToSection: (itemId: string, sectionId: string) => Promise<void>;
  managingItem: GroceriesItem | null;
  onCloseManagingItem: () => void;
  onUpdateItem: (itemId: string, data: Omit<GroceriesItemUpdate, 'feature_instance_id'>) => Promise<boolean>;
  onSetItemRenewal: (itemId: string, renewalDurationDays: number | null) => Promise<boolean>;
  onSetItemSuggestedQuantity: (itemId: string, suggestedQuantity: number | null) => Promise<boolean>;
}

const GroceriesCatalogModals: React.FC<Props> = ({
  featureInstanceId, sections,
  addingSection, onCloseAddingSection, onCreateSection,
  renamingSection, onCloseRenamingSection, onUpdateSection,
  deletingSection, onCloseDeletingSection, onDeleteSection,
  addingItemToSectionId, onCloseAddingItem, onCreateItem, onLinkItemToSection,
  managingItem, onCloseManagingItem, onUpdateItem, onSetItemRenewal, onSetItemSuggestedQuantity,
}) => {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);
  const addingItemToSection = addingItemToSectionId
    ? sections.find((s) => s.id === addingItemToSectionId) ?? null
    : null;

  const handleDeleteSection = async () => {
    if (!deletingSection) return;
    setDeleting(true);
    const ok = await onDeleteSection(deletingSection.id);
    setDeleting(false);
    if (ok) onCloseDeletingSection();
  };

  return (
    <>
      {addingSection && (
        <AddSectionModal
          title={t('features.groceries.addSection')}
          submitLabel={t('features.groceries.create')}
          onClose={onCloseAddingSection}
          onSubmit={async (name, icon, isFood) => {
            const created = await onCreateSection(name, icon ?? undefined, isFood);
            if (created) onCloseAddingSection();
          }}
        />
      )}

      {renamingSection && (
        <AddSectionModal
          title={t('features.groceries.renameSection')}
          submitLabel={t('features.groceries.save')}
          initialName={renamingSection.name}
          initialIcon={renamingSection.icon}
          initialIsFood={renamingSection.is_food}
          onClose={onCloseRenamingSection}
          onSubmit={async (name, icon, isFood) => {
            const ok = await onUpdateSection(renamingSection.id, { name, icon: icon ?? undefined, is_food: isFood });
            if (ok) onCloseRenamingSection();
          }}
        />
      )}

      {deletingSection && (
        <ThemedConfirmDialog
          isOpen
          onClose={onCloseDeletingSection}
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
          onClose={onCloseAddingItem}
          onCreate={async (data) => {
            const created = await onCreateItem(data);
            if (created) {
              await onLinkItemToSection(created.id, addingItemToSectionId);
              onCloseAddingItem();
            }
          }}
        />
      )}

      {managingItem && (
        <ManageItemModal
          item={managingItem}
          sections={sections}
          onClose={onCloseManagingItem}
          onUpdate={(data) => onUpdateItem(managingItem.id, data)}
          onSetRenewal={(renewalDurationDays) => onSetItemRenewal(managingItem.id, renewalDurationDays)}
          onSetSuggestedQuantity={
            (suggestedQuantity) => onSetItemSuggestedQuantity(managingItem.id, suggestedQuantity)
          }
          onToggleSection={(sectionId) => onLinkItemToSection(managingItem.id, sectionId)}
        />
      )}
    </>
  );
};

export default GroceriesCatalogModals;
