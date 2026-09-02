import { ThemedButton } from '@/app/platform/core/layout/themes/components/ThemedButton.tsx';
import { ThemedInput } from '@/app/platform/core/layout/themes/components/ThemedInput.tsx';
import { ThemedSelect } from '@/app/platform/core/layout/themes/components/ThemedSelect.tsx';
import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { SelectOption } from '@/app/platform/core/common.types.ts';
import { GROCERIES_UNITS, GroceriesUnit } from '@/types/groceries.ts';

import React from 'react';
import { useTranslation } from 'react-i18next';

import { CatalogSectionOption } from './types.ts';

interface Props {
  mode: 'addToCatalog' | 'oneOff';
  name: string;
  onNameChange: (name: string) => void;
  unit: GroceriesUnit;
  onUnitChange: (unit: GroceriesUnit) => void;
  sections: CatalogSectionOption[];
  sectionId: string;
  onSectionChange: (sectionId: string) => void;
  onBack: () => void;
}

const AddIngredientCustomForm: React.FC<Props> = ({
  mode, name, onNameChange, unit, onUnitChange, sections, sectionId, onSectionChange, onBack,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const unitOptions: SelectOption[] = GROCERIES_UNITS.map((u) => ({ value: u, label: t(`features.groceries.unit.${u}`) }));
  const sectionOptions: SelectOption[] = sections.map((s) => ({ value: s.id, label: s.name }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <span style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
        {t(mode === 'addToCatalog' ? 'features.recipes.addToCatalogHelp' : 'features.recipes.notInCatalogHelp')}
      </span>
      <ThemedInput label={t('features.recipes.customIngredientName')} value={name} onChange={(e) => onNameChange(e.target.value)} autoFocus />
      <ThemedSelect
        label={t('features.recipes.customIngredientUnit')}
        options={unitOptions}
        value={unit}
        allowEmpty={false}
        onChange={(v) => onUnitChange(v as GroceriesUnit)}
      />
      {mode === 'addToCatalog' && (
        <ThemedSelect
          label={t('features.recipes.customIngredientSection')}
          placeholder={t('features.recipes.customIngredientSectionPlaceholder')}
          options={sectionOptions}
          value={sectionId}
          onChange={onSectionChange}
        />
      )}
      <ThemedButton variant="ghost" type="button" onClick={onBack}>
        {t('features.recipes.changeIngredient')}
      </ThemedButton>
    </div>
  );
};

export default AddIngredientCustomForm;
