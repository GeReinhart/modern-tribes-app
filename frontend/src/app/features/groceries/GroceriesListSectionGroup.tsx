import React from 'react';

import GroceriesListColumnRow from './GroceriesListColumnRow.tsx';
import GroceriesSectionToggleHeader from './GroceriesSectionToggleHeader.tsx';
import { SectionGroup } from './sectionGrouping.ts';
import { GroceriesListItemDetail } from './types.ts';

interface Props {
  group: SectionGroup<GroceriesListItemDetail>;
  canEdit: boolean;
  expanded: boolean;
  onToggle: () => void;
  onUpdateQuantity: (id: string, quantity: number) => Promise<void>;
  onUpdateComment: (id: string, comment: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onManageCatalogItem: (catalogItemId: string) => void;
  focusItemId: string | null;
  onFocused: () => void;
}

const GroceriesListSectionGroup: React.FC<Props> = ({
  group, canEdit, expanded, onToggle, onUpdateQuantity, onUpdateComment, onRemove, onManageCatalogItem,
  focusItemId, onFocused,
}) => {
  return (
    <div style={{ marginBottom: '10px' }}>
      <GroceriesSectionToggleHeader
        icon={group.icon}
        name={group.name}
        count={group.items.length}
        expanded={expanded}
        onToggle={onToggle}
      />
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '18px' }}>
          {group.items.map((item) => {
            const catalogItemId = item.groceries_item_id;
            return (
              <GroceriesListColumnRow
                key={item.id}
                item={item}
                canEdit={canEdit}
                autoFocus={focusItemId === item.id}
                onFocused={onFocused}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateComment={onUpdateComment}
                onRemove={onRemove}
                onManage={catalogItemId ? () => onManageCatalogItem(catalogItemId) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroceriesListSectionGroup;
