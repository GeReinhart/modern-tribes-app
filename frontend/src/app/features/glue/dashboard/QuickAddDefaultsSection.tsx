import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { quickAddDefaultsService } from './quickAddDefaults.service.ts';
import type { QuickAddType } from './quickAddDefaults.types.ts';
import { useAllFeatureInstances } from './useAllFeatureInstances.ts';
import { useQuickAddDefaults } from './useQuickAddDefaults.ts';

const NONE_VALUE = '';

const TYPE_ROWS: { quickAddType: QuickAddType; featureTypes: string[]; labelKey: string }[] = [
  { quickAddType: 'task', featureTypes: ['kanban', 'todo_list'], labelKey: 'dashboard.quickAddDefaults.task' },
  { quickAddType: 'event', featureTypes: ['events'], labelKey: 'dashboard.quickAddDefaults.event' },
];

export const QuickAddDefaultsSection: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { options } = useAllFeatureInstances();
  const { data, refetch } = useQuickAddDefaults();
  const [savingType, setSavingType] = useState<QuickAddType | null>(null);

  const handleChange = async (quickAddType: QuickAddType, value: string) => {
    setSavingType(quickAddType);
    try {
      await quickAddDefaultsService.set(quickAddType, value === NONE_VALUE ? null : value);
      await refetch();
    } finally {
      setSavingType(null);
    }
  };

  const selectStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: '6px',
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    fontSize: 'var(--font-sm)',
    flex: 1,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: theme.colors.text }}>
        {t('dashboard.quickAddDefaults.title')}
      </span>
      {TYPE_ROWS.map(({ quickAddType, featureTypes, labelKey }) => {
        const filtered = options.filter((o) => featureTypes.includes(o.instance.feature_type));
        const configuredId = data?.[quickAddType].feature_instance_id ?? NONE_VALUE;
        return (
          <label key={quickAddType} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span style={{ width: '90px', fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>
              {t(labelKey)}
            </span>
            <select
              value={configuredId}
              disabled={savingType === quickAddType}
              onChange={(e) => handleChange(quickAddType, e.target.value)}
              style={selectStyle}
            >
              <option value={NONE_VALUE}>{t('dashboard.quickAddDefaults.none')}</option>
              {filtered.map((opt) => (
                <option key={opt.instance.id} value={opt.instance.id}>
                  {opt.tribe_name} — {opt.project_name} — {opt.instance.name}
                </option>
              ))}
            </select>
          </label>
        );
      })}
    </div>
  );
};
