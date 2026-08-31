import { formatUnitSuffix } from '@/app/platform/core/formatQuantity.ts';
import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCheckbox } from '@/app/platform/core/layout/themes/components/ThemedCheckbox.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { SelectOption } from '@/app/platform/core/common.types.ts';
import { GROCERIES_UNITS, GroceriesUnit } from '@/types/groceries.ts';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import RecipeIngredientCatalogPicker from './RecipeIngredientCatalogPicker.tsx';
import { recipesService } from './service.ts';
import { CatalogItemOption, CatalogSectionOption, RecipeIngredientCreate } from './types.ts';

interface Props {
  featureInstanceId: string;
  onClose: () => void;
  onSubmit: (data: RecipeIngredientCreate) => Promise<boolean>;
}

const AddIngredientModal: React.FC<Props> = ({ featureInstanceId, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [catalogItems, setCatalogItems] = useState<CatalogItemOption[]>([]);
  const [catalogSections, setCatalogSections] = useState<CatalogSectionOption[]>([]);
  const [useCustom, setUseCustom] = useState(false);
  const [catalogItemId, setCatalogItemId] = useState('');
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

  const quantityValue = Number(quantity);
  const selectedCatalogItem = catalogItems.find((i) => i.id === catalogItemId);
  const isDivisible = useCustom || (selectedCatalogItem?.is_divisible ?? true);
  const isValid =
    quantityValue > 0 &&
    (isDivisible || Number.isInteger(quantityValue)) &&
    (useCustom ? customName.trim().length > 0 : catalogItemId.length > 0);
  const unitOptions: SelectOption[] = GROCERIES_UNITS.map((u) => ({ value: u, label: t(`features.groceries.unit.${u}`) }));
  const sectionOptions: SelectOption[] = catalogSections.map((s) => ({ value: s.id, label: s.name }));

  const createCustomCatalogItem = async (): Promise<string> => {
    const item = await recipesService.createCatalogItem({
      feature_instance_id: featureInstanceId, name: customName.trim(), unit: customUnit,
    });
    if (customSectionId) {
      await recipesService.linkCatalogItemToSection(item.id, customSectionId, featureInstanceId);
    }
    return item.id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    const groceriesItemId = useCustom ? await createCustomCatalogItem() : catalogItemId;
    const data: RecipeIngredientCreate = {
      groceries_item_id: groceriesItemId, quantity: quantityValue,
      display_override: displayOverride.trim() || undefined, is_accompaniment: isAccompaniment,
    };
    const ok = await onSubmit(data);
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={t('features.recipes.addIngredient')}>
      <form onSubmit={handleSubmit}>
        <ThemedModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ThemedCheckbox
              label={t('features.recipes.customIngredient')}
              helperText={t('features.recipes.customIngredientHelp')}
              checked={useCustom}
              onChange={setUseCustom}
            />
            {useCustom ? (
              <>
                <ThemedInput
                  label={t('features.recipes.customIngredientName')}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  autoFocus
                />
                <ThemedSelect
                  label={t('features.recipes.customIngredientUnit')}
                  options={unitOptions}
                  value={customUnit}
                  allowEmpty={false}
                  onChange={(v) => setCustomUnit(v as GroceriesUnit)}
                />
                <ThemedSelect
                  label={t('features.recipes.customIngredientSection')}
                  placeholder={t('features.recipes.customIngredientSectionPlaceholder')}
                  options={sectionOptions}
                  value={customSectionId}
                  onChange={setCustomSectionId}
                />
              </>
            ) : selectedCatalogItem ? (
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
                <ThemedButton variant="ghost" type="button" onClick={() => setCatalogItemId('')}>
                  {t('features.recipes.changeIngredient')}
                </ThemedButton>
              </div>
            ) : (
              <RecipeIngredientCatalogPicker
                items={catalogItems}
                sections={catalogSections}
                onSelect={setCatalogItemId}
              />
            )}
            <ThemedInput
              label={t('features.recipes.quantity')}
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
