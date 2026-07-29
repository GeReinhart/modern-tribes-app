import { useTheme } from '@/app/platform/core/layout/themes/ThemeContext.tsx';
import { ThemedSvgIcon } from '@/app/platform/core/layout/themes/icons/ThemedSvgIcon.tsx';
import type { ProjectFeatureInstance } from '@/app/features/tribes-projects/projects/project-features.types.ts';

import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { useAllFeatureInstances } from './useAllFeatureInstances.ts';

interface Props {
  featureTypes: string[];
  selectedInstanceId: string | null;
  onSelect: (instance: ProjectFeatureInstance | null) => void;
  preferredInstanceId?: string | null;
}

const FeatureInstanceBadgePicker: React.FC<Props> = ({
  featureTypes,
  selectedInstanceId,
  onSelect,
  preferredInstanceId,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { options, loading } = useAllFeatureInstances();

  const filtered = useMemo(
    () => options.filter((o) => featureTypes.includes(o.instance.feature_type)),
    [options, featureTypes],
  );

  // Tracks an explicit "change" click so the auto-select effect below
  // doesn't immediately snap back to the same preferred instance. Set only
  // by handleChange, never by the auto-select itself, so it can never
  // suppress the initial preselection.
  const userClearedRef = useRef(false);

  useEffect(() => {
    if (loading || selectedInstanceId !== null || userClearedRef.current) return;
    const preferred = preferredInstanceId
      ? filtered.find((o) => o.instance.id === preferredInstanceId)
      : undefined;
    const toSelect = preferred ?? (filtered.length === 1 ? filtered[0] : undefined);
    if (toSelect) onSelect(toSelect.instance);
  }, [loading, filtered, selectedInstanceId, preferredInstanceId, onSelect]);

  const handleChange = () => {
    userClearedRef.current = true;
    onSelect(null);
  };

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
      <div>
        <div style={sectionLabel}>{t('dashboard.quickAdd.selectFeature')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              flex: 1, minWidth: 0,
              padding: '6px 14px',
              borderRadius: '20px',
              border: `2px solid ${theme.colors.primary}`,
              backgroundColor: `${theme.colors.primary}25`,
              color: theme.colors.primary,
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedOption.tribe_name} — {selectedOption.project_name} — {selectedOption.instance.name}
          </span>
          <button
            type="button"
            onClick={handleChange}
            title={t('dashboard.quickAdd.changeFeature')}
            aria-label={t('dashboard.quickAdd.changeFeature')}
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              padding: '6px',
              lineHeight: 0,
              flexShrink: 0,
            }}
          >
            <ThemedSvgIcon name="refresh" color={theme.colors.secondary} size={16} />
          </button>
        </div>
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
