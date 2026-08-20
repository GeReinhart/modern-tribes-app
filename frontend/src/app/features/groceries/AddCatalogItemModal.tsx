import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedCheckbox } from '@/app/platform/core/layout/themes/components/ThemedCheckbox.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedModal, ThemedModalBody, ThemedModalFooter } from '@/app/platform/core/layout/themes/components/ThemedModal.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { IconName, ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { SelectOption } from '@/app/platform/core/common.types.ts';
import { GROCERIES_UNITS, GroceriesUnit } from '@/types/groceries.ts';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import GroceriesIconPicker from './GroceriesIconPicker.tsx';
import { GroceriesItemCreate, GroceriesSection } from './types.ts';

interface Props {
  featureInstanceId: string;
  section: GroceriesSection | null;
  onClose: () => void;
  onCreate: (data: GroceriesItemCreate) => Promise<void>;
}

const AddCatalogItemModal: React.FC<Props> = ({ featureInstanceId, section, onClose, onCreate }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<GroceriesUnit>('piece');
  const [icon, setIcon] = useState<string | null>(null);
  const [isDivisible, setIsDivisible] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const unitOptions: SelectOption[] = GROCERIES_UNITS.map((u) => ({
    value: u,
    label: t(`features.groceries.unit.${u}`),
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await onCreate({
      feature_instance_id: featureInstanceId, name: name.trim(), unit, icon: icon ?? undefined,
      is_divisible: isDivisible,
    });
    setSubmitting(false);
  };

  return (
    <ThemedModal isOpen onClose={onClose} title={t('features.groceries.newItem')}>
      <form onSubmit={handleSubmit}>
        <ThemedModalBody>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {section && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: `${theme.colors.primary}10`,
                  color: theme.colors.primary,
                  fontSize: 'var(--font-sm)',
                }}
              >
                <span style={{ color: theme.colors.secondary }}>{t('features.groceries.addingToSection')}</span>
                {section.icon && <ThemedSvgIcon name={section.icon as IconName} color={theme.colors.primary} size={16} />}
                <strong>{section.name}</strong>
              </div>
            )}
            <ThemedInput
              label={t('features.groceries.newItemName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('features.groceries.newItemNamePlaceholder')}
              autoFocus
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
              helperText={t('features.groceries.isDivisibleHelp')}
              checked={isDivisible}
              onChange={setIsDivisible}
            />
            <div>
              <div style={{ fontSize: 'var(--font-sm)', fontWeight: 500, marginBottom: '8px' }}>
                {t('features.groceries.iconLabel')}
              </div>
              <GroceriesIconPicker value={icon} onChange={setIcon} />
            </div>
          </div>
        </ThemedModalBody>
        <ThemedModalFooter>
          <ThemedButton variant="ghost" type="button" onClick={onClose}>
            {t('features.groceries.cancel')}
          </ThemedButton>
          <ThemedButton variant="primary" type="submit" isLoading={submitting} disabled={!name.trim()}>
            {t('features.groceries.create')}
          </ThemedButton>
        </ThemedModalFooter>
      </form>
    </ThemedModal>
  );
};

export default AddCatalogItemModal;
