import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import type { ProjectFeatureInstance } from '@/app/features/tribes-projects/projects/project-features.types.ts';

import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAllFeatureInstances } from './useAllFeatureInstances.ts';

interface Props {
  featureTypes: string[];
  selectedInstanceId: string | null;
  onSelect: (instance: ProjectFeatureInstance | null) => void;
}

const FeatureInstanceBadgePicker: React.FC<Props> = ({
  featureTypes,
  selectedInstanceId,
  onSelect,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { options, loading } = useAllFeatureInstances();

  const filtered = useMemo(
    () => options.filter((o) => featureTypes.includes(o.instance.feature_type)),
    [options, featureTypes],
  );

  useEffect(() => {
    if (!loading && filtered.length === 1 && selectedInstanceId === null) {
      onSelect(filtered[0].instance);
    }
  }, [loading, filtered, selectedInstanceId, onSelect]);

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: theme.colors.secondary,
    marginBottom: '8px',
  };

  if (loading) {
    return <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>{t('common.loading')}</div>;
  }

  if (!filtered.length) {
    return <div style={{ fontSize: 'var(--font-sm)', color: theme.colors.secondary }}>{t('dashboard.quickAdd.noInstanceOfType')}</div>;
  }

  const selectedOption = filtered.find((o) => o.instance.id === selectedInstanceId);

  if (selectedOption) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={sectionLabel}>{t('dashboard.quickAdd.selectFeature')}</div>
        <span
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: `2px solid ${theme.colors.primary}`,
            backgroundColor: `${theme.colors.primary}25`,
            color: theme.colors.primary,
            fontSize: 'var(--font-xs)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {selectedOption.tribe_name} — {selectedOption.project_name} — {selectedOption.instance.name}
        </span>
        <button
          type="button"
          onClick={() => onSelect(null)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 'var(--font-xs)',
            color: theme.colors.secondary,
            textDecoration: 'underline',
            padding: 0,
            flexShrink: 0,
          }}
        >
          {t('dashboard.quickAdd.changeFeature')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={sectionLabel}>{t('dashboard.quickAdd.selectFeature')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {filtered.map((opt) => (
          <button
            key={opt.instance.id}
            type="button"
            onClick={() => onSelect(opt.instance)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: `2px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.surface,
              color: theme.colors.text,
              fontSize: 'var(--font-xs)',
              fontWeight: 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'border-color 0.15s, background-color 0.15s',
            }}
          >
            {opt.tribe_name} — {opt.project_name} — {opt.instance.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FeatureInstanceBadgePicker;
