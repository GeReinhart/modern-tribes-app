import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCheckbox } from '@/app/platform/core/layout/themes/components/ThemedCheckbox.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { SelectOption } from '@/app/platform/core/common.types.ts';
import { GROCERIES_UNITS, GroceriesUnit } from '@/types/groceries.ts';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import GroceriesIconPickerField from './GroceriesIconPickerField.tsx';
import { GroceriesItem, GroceriesItemUpdate, GroceriesSection } from './types.ts';

interface Props {
  item: GroceriesItem;
  sections: GroceriesSection[];
  onClose: () => void;
  onUpdate: (data: Omit<GroceriesItemUpdate, 'feature_instance_id'>) => Promise<boolean>;
  onSetRenewal: (renewalDurationDays: number | null) => Promise<boolean>;
  onSetSuggestedQuantity: (suggestedQuantity: number | null) => Promise<boolean>;
  onToggleSection: (sectionId: string) => Promise<void>;
}

const ManageItemModal: React.FC<Props> = ({
  item, sections, onClose, onUpdate, onSetRenewal, onSetSuggestedQuantity, onToggleSection,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [name, setName] = useState(item.name);
  const [unit, setUnit] = useState<GroceriesUnit>(item.unit);
  const [icon, setIcon] = useState<string | null>(item.icon);
  const [isDivisible, setIsDivisible] = useState(item.is_divisible);
  const [renewal, setRenewal] = useState(
    item.renewal_duration_days !== null ? String(item.renewal_duration_days) : '',
  );
  const [suggestedQuantity, setSuggestedQuantity] = useState(
    item.suggested_quantity !== null ? String(item.suggested_quantity) : '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const handleArchive = async () => {
    setArchiving(true);
    const ok = await onUpdate({ status: 'archived' });
    setArchiving(false);
    if (ok) onClose();
  };

  const unitOptions: SelectOption[] = GROCERIES_UNITS.map((u) => ({
    value: u,
    label: t(`features.groceries.unit.${u}`),
  }));

  const renewalValue = renewal.trim() === '' ? null : Number(renewal);
  const suggestedQuantityValue = suggestedQuantity.trim() === '' ? null : Number(suggestedQuantity);
  const hasChanges =
    name.trim() !== item.name ||
    unit !== item.unit ||
    icon !== item.icon ||
    isDivisible !== item.is_divisible ||
    renewalValue !== item.renewal_duration_days ||
    suggestedQuantityValue !== item.suggested_quantity;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    let ok = true;
    if (
      name.trim() !== item.name || unit !== item.unit || icon !== item.icon || isDivisible !== item.is_divisible
    ) {
      ok = await onUpdate({ name: name.trim(), unit, icon: icon ?? undefined, is_divisible: isDivisible });
    }
    if (ok && renewalValue !== item.renewal_duration_days) {
      ok = await onSetRenewal(renewalValue);
    }
    if (ok && suggestedQuantityValue !== item.suggested_quantity) {
      ok = await onSetSuggestedQuantity(suggestedQuantityValue);
    }
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={item.name}>
      <ThemedModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ThemedInput
            label={t('features.groceries.newItemName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <ThemedSelect
            label={t('features.groceries.unitLabel')}
            options={unitOptions}
            value={unit}
            allowEmpty={false}
            onChange={(v) => setUnit(v as GroceriesUnit)}
          />
          <ThemedCheckbox
            label={t('features.groceries.isDivisible')}
            checked={isDivisible}
            onChange={setIsDivisible}
          />
          <ThemedInput
            label={t('features.groceries.renewalDays')}
            helperText={t('features.groceries.renewalDaysHelp')}
            type="number"
            min="1"
            value={renewal}
            onChange={(e) => setRenewal(e.target.value)}
            placeholder={t('features.groceries.renewalDaysPlaceholder')}
          />
          <ThemedInput
            label={t('features.groceries.suggestedQuantity')}
            helperText={t('features.groceries.suggestedQuantityHelp')}
            type="number"
            min="0"
            step={isDivisible ? '0.01' : '1'}
            value={suggestedQuantity}
            onChange={(e) => setSuggestedQuantity(e.target.value)}
            placeholder={t('features.groceries.suggestedQuantityPlaceholder')}
          />
          <GroceriesIconPickerField value={icon} onChange={setIcon} />
          <div>
            <div style={{ fontSize: 'var(--font-sm)', fontWeight: 500, marginBottom: '8px' }}>
              {t('features.groceries.sectionsLabel')}
            </div>
            {sections.length === 0 && (
              <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
                {t('features.groceries.noSectionsYet')}
              </span>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {sections.map((section) => (
                <ThemedCheckbox
                  key={section.id}
                  label={section.name}
                  checked={item.section_ids.includes(section.id)}
                  onChange={() => onToggleSection(section.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </ThemedModalBody>
      <ThemedModalFooter>
        <ThemedButton
          variant="danger"
          type="button"
          onClick={handleArchive}
          isLoading={archiving}
          icon="archive"
          iconOnly
        >
          {t('features.groceries.archiveItem')}
        </ThemedButton>
        <ThemedButton variant="ghost" type="button" onClick={onClose} icon="x" iconOnly>
          {t('features.groceries.cancel')}
        </ThemedButton>
        <ThemedButton
          variant="primary"
          type="button"
          onClick={handleSave}
          isLoading={submitting}
          disabled={!name.trim() || !hasChanges}
          icon="save"
          iconOnly
        >
          {t('features.groceries.save')}
        </ThemedButton>
      </ThemedModalFooter>
    </ThemedModal>
  );
};

export default ManageItemModal;
