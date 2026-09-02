import { formatUnitSuffix } from '@/app/platform/core/formatQuantity.ts';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCheckbox } from '@/app/platform/core/layout/themes/components/ThemedCheckbox.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { GroceriesUnit } from '@/types/groceries.ts';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import AddIngredientCustomForm from './AddIngredientCustomForm.tsx';
import AddIngredientSearchPanel from './AddIngredientSearchPanel.tsx';
import { recipesService } from './service.ts';
import { CatalogItemOption, CatalogSectionOption, RecipeIngredientCreate } from './types.ts';

interface Props {
  featureInstanceId: string;
  onClose: () => void;
  onSubmit: (data: RecipeIngredientCreate) => Promise<boolean>;
}

type Selection = { type: 'none' } | { type: 'catalog'; id: string } | { type: 'addToCatalog' } | { type: 'oneOff' };

const AddIngredientModal: React.FC<Props> = ({ featureInstanceId, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [catalogItems, setCatalogItems] = useState<CatalogItemOption[]>([]);
  const [catalogSections, setCatalogSections] = useState<CatalogSectionOption[]>([]);
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState<Selection>({ type: 'none' });
  const [customName, setCustomName] = useState('');
  const [customUnit, setCustomUnit] = useState<GroceriesUnit>('piece');
  const [customSectionId, setCustomSectionId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [displayOverride, setDisplayOverride] = useState('');
  const [isAccompaniment, setIsAccompaniment] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    recipesService.listCatalogItems(featureInstanceId).then(setCatalogItems).catch(() => undefined);
    recipesService.listCatalogSections(featureInstanceId).then(setCatalogSections).catch(() => undefined);
  }, [featureInstanceId]);

  const selectedCatalogItem = selection.type === 'catalog' ? catalogItems.find((i) => i.id === selection.id) : undefined;
  const quantityValue = Number(quantity);
  const isDivisible = selection.type !== 'catalog' || (selectedCatalogItem?.is_divisible ?? true);
  const quantityUnit = selection.type === 'catalog' ? (selectedCatalogItem?.unit ?? null) : selection.type !== 'none' ? customUnit : null;
  const quantityUnitSuffix = formatUnitSuffix(quantityUnit, t);
  const quantityLabel = quantityUnitSuffix ? `${t('features.recipes.quantity')} ${quantityUnitSuffix}` : t('features.recipes.quantity');
  const isValid =
    quantityValue > 0 &&
    (isDivisible || Number.isInteger(quantityValue)) &&
    (selection.type === 'catalog' ? Boolean(selectedCatalogItem) : selection.type !== 'none' && customName.trim().length > 0);

  const chooseAddToCatalog = () => {
    setCustomName(search.trim());
    setSelection({ type: 'addToCatalog' });
  };
  const chooseOneOff = () => {
    setCustomName(search.trim());
    setSelection({ type: 'oneOff' });
  };
  const resetSelection = () => setSelection({ type: 'none' });

  const createCustomCatalogItem = async (): Promise<string> => {
    const item = await recipesService.createCatalogItem({
      feature_instance_id: featureInstanceId, name: customName.trim(), unit: customUnit,
    });
    if (customSectionId) {
      await recipesService.linkCatalogItemToSection(item.id, customSectionId, featureInstanceId);
    }
    return item.id;
  };

  const buildIngredientData = async (): Promise<RecipeIngredientCreate> => {
    const base = { quantity: quantityValue, display_override: displayOverride.trim() || undefined, is_accompaniment: isAccompaniment };
    if (selection.type === 'catalog') return { ...base, groceries_item_id: selection.id };
    if (selection.type === 'addToCatalog') return { ...base, groceries_item_id: await createCustomCatalogItem() };
    return { ...base, custom_name: customName.trim(), custom_unit: customUnit };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    const ok = await onSubmit(await buildIngredientData());
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={t('features.recipes.addIngredient')}>
      <form onSubmit={handleSubmit}>
        <ThemedModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {selection.type === 'none' && (
              <AddIngredientSearchPanel
                items={catalogItems}
                sections={catalogSections}
                search={search}
                onSearchChange={setSearch}
                onSelectCatalogItem={(id) => setSelection({ type: 'catalog', id })}
                onChooseAddToCatalog={chooseAddToCatalog}
                onChooseOneOff={chooseOneOff}
              />
            )}
            {selection.type === 'catalog' && selectedCatalogItem && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', border: `1px solid ${theme.colors.border}`, borderRadius: 'var(--radius-md)',
                }}
              >
                <span>
                  {selectedCatalogItem.name}
                  {formatUnitSuffix(selectedCatalogItem.unit, t) && ` ${formatUnitSuffix(selectedCatalogItem.unit, t)}`}
                </span>
                <ThemedButton variant="ghost" type="button" onClick={resetSelection}>
                  {t('features.recipes.changeIngredient')}
                </ThemedButton>
              </div>
            )}
            {(selection.type === 'addToCatalog' || selection.type === 'oneOff') && (
              <AddIngredientCustomForm
                mode={selection.type}
                name={customName}
                onNameChange={setCustomName}
                unit={customUnit}
                onUnitChange={setCustomUnit}
                sections={catalogSections}
                sectionId={customSectionId}
                onSectionChange={setCustomSectionId}
                onBack={resetSelection}
              />
            )}
            {selection.type !== 'none' && (
              <>
                <ThemedInput
                  label={quantityLabel}
                  type="number"
                  step={isDivisible ? '0.01' : '1'}
                  min={isDivisible ? 0.01 : 1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <ThemedInput
                  label={t('features.recipes.displayOverride')}
                  placeholder={t('features.recipes.displayOverridePlaceholder')}
                  value={displayOverride}
                  onChange={(e) => setDisplayOverride(e.target.value)}
                />
                <ThemedCheckbox
                  label={t('features.recipes.isAccompaniment')}
                  helperText={t('features.recipes.isAccompanimentHelp')}
                  checked={isAccompaniment}
                  onChange={setIsAccompaniment}
                />
              </>
            )}
          </div>
        </ThemedModalBody>
        <ThemedModalFooter>
          <ThemedButton variant="ghost" type="button" onClick={onClose}>
            {t('features.recipes.cancel')}
          </ThemedButton>
          <ThemedButton variant="primary" type="submit" isLoading={submitting} disabled={!isValid}>
            {t('features.recipes.add')}
          </ThemedButton>
        </ThemedModalFooter>
      </form>
    </ThemedModal>
  );
};

export default AddIngredientModal;
