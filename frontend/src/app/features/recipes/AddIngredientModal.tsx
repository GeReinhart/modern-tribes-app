import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCheckbox } from '@/app/platform/core/layout/themes/components/ThemedCheckbox.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { recipesService } from './service.ts';
import { CatalogItemOption, RecipeIngredientCreate } from './types.ts';

interface Props {
  featureInstanceId: string;
  onClose: () => void;
  onSubmit: (data: RecipeIngredientCreate) => Promise<boolean>;
}

const AddIngredientModal: React.FC<Props> = ({ featureInstanceId, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [catalogItems, setCatalogItems] = useState<CatalogItemOption[]>([]);
  const [useCustom, setUseCustom] = useState(false);
  const [catalogItemId, setCatalogItemId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isAccompaniment, setIsAccompaniment] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    recipesService.listCatalogItems(featureInstanceId).then(setCatalogItems).catch(() => undefined);
  }, [featureInstanceId]);

  const quantityValue = Number(quantity);
  const selectedCatalogItem = catalogItems.find((i) => i.id === catalogItemId);
  const isDivisible = useCustom || (selectedCatalogItem?.is_divisible ?? true);
  const isValid =
    quantityValue > 0 &&
    (isDivisible || Number.isInteger(quantityValue)) &&
    (useCustom ? customName.trim().length > 0 : catalogItemId.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    const data: RecipeIngredientCreate = useCustom
      ? {
        custom_name: customName.trim(), custom_unit: customUnit.trim() || undefined, quantity: quantityValue,
        is_accompaniment: isAccompaniment,
      }
      : { groceries_item_id: catalogItemId, quantity: quantityValue, is_accompaniment: isAccompaniment };
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
                <ThemedInput
                  label={t('features.recipes.customIngredientUnit')}
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                />
              </>
            ) : (
              <ThemedSelect
                label={t('features.recipes.catalogItem')}
                options={catalogItems.map((i) => ({ value: i.id, label: `${i.name} (${i.unit})` }))}
                value={catalogItemId}
                onChange={setCatalogItemId}
                allowEmpty
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
